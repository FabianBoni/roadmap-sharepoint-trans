import type { NextApiRequest } from 'next';

export type EntraRedirectEnv = {
  ENTRA_REDIRECT_URI?: string;
  APP_ORIGIN?: string;
  PORT?: string;
  NEXT_PUBLIC_DEPLOYMENT_ENV?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_BASE_PATH_DEV?: string;
  NEXT_PUBLIC_BASE_PATH_PROD?: string;
};

export function resolveNextBasePathFromEnv(env: {
  NEXT_PUBLIC_DEPLOYMENT_ENV?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_BASE_PATH_DEV?: string;
  NEXT_PUBLIC_BASE_PATH_PROD?: string;
}): string {
  const deploymentEnv = env.NEXT_PUBLIC_DEPLOYMENT_ENV || env.NODE_ENV || 'development';
  const rawBasePath =
    deploymentEnv === 'production'
      ? env.NEXT_PUBLIC_BASE_PATH_PROD || ''
      : env.NEXT_PUBLIC_BASE_PATH_DEV || '';
  return (rawBasePath || '').replace(/\/$/, '');
}

export function getRequestOrigin(req: NextApiRequest): string {
  void req;
  const configured = String(process.env.APP_ORIGIN || '')
    .split(',')[0]
    ?.trim();
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_ORIGIN or ENTRA_REDIRECT_URI is required in production');
  }
  const port = /^\d{1,5}$/.test(process.env.PORT || '') ? process.env.PORT : '3000';
  return `http://127.0.0.1:${port}`;
}

export function getEntraRedirectUri(args: {
  req: NextApiRequest;
  env: EntraRedirectEnv;
  callbackPath?: string;
}): string {
  if (args.env.ENTRA_REDIRECT_URI && args.env.ENTRA_REDIRECT_URI.trim()) {
    return args.env.ENTRA_REDIRECT_URI.trim();
  }
  if (args.env.NODE_ENV === 'production' || args.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'production') {
    throw new Error('ENTRA_REDIRECT_URI is required in production');
  }
  const origin = getRequestOrigin(args.req);
  const basePath = resolveNextBasePathFromEnv(args.env);
  const callback = args.callbackPath || '/api/auth/entra/callback';
  return `${origin}${basePath}${callback}`;
}
