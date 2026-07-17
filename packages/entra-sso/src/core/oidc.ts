export type TokenExchangeResult = {
  idToken?: string;
  accessToken?: string;
  raw: unknown;
};

export type ValidatedIdTokenClaims = Record<string, unknown> & {
  nonce?: string;
  groups?: unknown;
  department?: unknown;
};

function constantTimeStringEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

type OidcMetadata = { issuer: string; jwks_uri: string };
const metadataCache = new Map<string, Promise<OidcMetadata>>();

async function getOidcMetadata(tenantId: string): Promise<OidcMetadata> {
  const key = tenantId.trim().toLowerCase();
  const existing = metadataCache.get(key);
  if (existing) return existing;

  const request = (async () => {
    const url = `https://login.microsoftonline.com/${encodeURIComponent(
      tenantId
    )}/v2.0/.well-known/openid-configuration`;
    const response = await fetch(url);
    const raw: unknown = await response.json().catch(() => null);
    const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
    if (
      !response.ok ||
      !record ||
      typeof record.issuer !== 'string' ||
      typeof record.jwks_uri !== 'string'
    ) {
      throw new Error(`Unable to load Entra OpenID configuration (${response.status})`);
    }
    return { issuer: record.issuer, jwks_uri: record.jwks_uri };
  })();

  metadataCache.set(key, request);
  try {
    return await request;
  } catch (error) {
    metadataCache.delete(key);
    throw error;
  }
}

export async function validateEntraIdToken(args: {
  idToken: string;
  tenantId: string;
  clientId: string;
  nonce: string;
}): Promise<ValidatedIdTokenClaims> {
  const [{ createRemoteJWKSet, jwtVerify }, metadata] = await Promise.all([
    import('jose'),
    getOidcMetadata(args.tenantId),
  ]);
  const jwks = createRemoteJWKSet(new URL(metadata.jwks_uri));
  const { payload } = await jwtVerify(args.idToken, jwks, {
    issuer: metadata.issuer,
    audience: args.clientId,
    algorithms: ['RS256'],
    clockTolerance: 60,
  });

  if (typeof payload.nonce !== 'string' || !constantTimeStringEquals(payload.nonce, args.nonce)) {
    throw new Error('Invalid ID token nonce');
  }
  return payload as ValidatedIdTokenClaims;
}

export function getEntraAuthority(tenantId: string): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0`;
}

export function buildAuthorizeUrl(args: {
  tenantId: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  scopes: string[];
  prompt?: string;
}): string {
  const authority = getEntraAuthority(args.tenantId);
  const url = new URL(`${authority}/authorize`);

  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', args.scopes.join(' '));
  url.searchParams.set('state', args.state);
  url.searchParams.set('nonce', args.nonce);
  url.searchParams.set('code_challenge', args.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  if (args.prompt) url.searchParams.set('prompt', args.prompt);

  return url.toString();
}

export async function exchangeCodeForTokens(args: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TokenExchangeResult> {
  const authority = getEntraAuthority(args.tenantId);

  const body = new URLSearchParams();
  body.set('client_id', args.clientId);
  body.set('client_secret', args.clientSecret);
  body.set('grant_type', 'authorization_code');
  body.set('code', args.code);
  body.set('redirect_uri', args.redirectUri);
  body.set('code_verifier', args.codeVerifier);

  const resp = await fetch(`${authority}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const raw: unknown = await resp.json().catch(() => ({}));
  const rawObj = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;

  if (!resp.ok) {
    const message =
      typeof rawObj.error_description === 'string'
        ? rawObj.error_description
        : typeof rawObj.error === 'string'
          ? rawObj.error
          : `Token exchange failed (${resp.status})`;
    throw new Error(message);
  }

  return {
    idToken: typeof rawObj.id_token === 'string' ? rawObj.id_token : undefined,
    accessToken: typeof rawObj.access_token === 'string' ? rawObj.access_token : undefined,
    raw,
  };
}
