import https from 'https';
import fs from 'fs';
import path from 'path';
import { Agent as UndiciAgent, Dispatcher } from 'undici';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { assertGlobalTlsPolicy } from './tlsPolicy';

// Optional HTTPS agent for a custom CA used by on-prem SharePoint.
// Environment variables:
//   SP_TRUSTED_CA_PATH: Absolute (or relative to project root) path to a PEM file containing the trusted CA chain.

let agent: https.Agent | undefined;
let dispatcher: Dispatcher | undefined;

assertGlobalTlsPolicy();

function resolvePathMaybe(p: string | undefined) {
  if (!p) return undefined;
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

try {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const caPath = resolvePathMaybe(process.env.SP_TRUSTED_CA_PATH);

  // IMPORTANT: Avoid forcing proxy agents globally here.
  // Let each HTTP client (fetch/got/undici) handle HTTP_PROXY/HTTPS_PROXY env vars themselves.
  // If you need a custom proxy agent, use SP_CUSTOM_PROXY_AGENT=true to enable
  if (proxyUrl && process.env.SP_CUSTOM_PROXY_AGENT === 'true') {
    // Use proxy agent (handles Windows auth via CNTLM/Px proxy)
    agent = new HttpsProxyAgent(proxyUrl) as unknown as https.Agent;
    dispatcher = new UndiciAgent({
      connect: { rejectUnauthorized: true },
    });
    console.log('[httpsAgent] Using configured custom proxy agent');
  } else if (proxyUrl) {
    // Proxy configured but not creating custom agent - let libraries handle it via env vars
    console.log('[httpsAgent] Proxy configured; HTTP client environment handling remains active');
  } else if (caPath && fs.existsSync(caPath)) {
    const ca = fs.readFileSync(caPath, 'utf8');
    agent = new https.Agent({ ca });
    dispatcher = new UndiciAgent({ connect: { ca } });
    // Set NODE_EXTRA_CA_CERTS early so any other libraries relying on OpenSSL store see it
    if (!process.env.NODE_EXTRA_CA_CERTS) {
      process.env.NODE_EXTRA_CA_CERTS = caPath;
    }
    console.log('[httpsAgent] Using configured custom CA');
  } else {
    console.log('[httpsAgent] No custom CA configured; relying on system trust store');
  }
} catch {
  console.warn('[httpsAgent] Failed to configure HTTPS agent');
}

export const sharePointHttpsAgent = agent;
export const sharePointDispatcher = dispatcher;
