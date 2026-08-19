import { spawn } from 'node:child_process';
import { chmod, mkdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const TICKET_REFRESH_MS = 7 * 60 * 60 * 1000;
const KINIT_TIMEOUT_MS = 20_000;

type TicketState = {
  principal: string;
  cacheName: string;
  refreshAt: number;
};

let ticketState: TicketState | null = null;
let ticketInFlight: Promise<string> | null = null;

export function normalizeKerberosPrincipal(username: string, realmHint?: string): string {
  const value = username.trim();
  if (!value) return '';
  if (value.includes('@')) return value;

  const separator = value.indexOf('\\');
  if (separator > 0 && separator < value.length - 1) {
    const domain = value.slice(0, separator).trim();
    const account = value.slice(separator + 1).trim();
    const realm = String(realmHint || domain)
      .trim()
      .toUpperCase();
    return realm ? `${account}@${realm}` : account;
  }

  const realm = String(realmHint || '')
    .trim()
    .toUpperCase();
  return realm ? `${value}@${realm}` : value;
}

const runKinit = async (principal: string, password: string, cacheName: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('kinit', ['-c', cacheName, '-l', '8h', principal], {
      env: { ...process.env, KRB5CCNAME: cacheName },
      stdio: ['pipe', 'ignore', 'ignore'],
      windowsHide: true,
    });
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error('kinit timed out'));
    }, KINIT_TIMEOUT_MS);

    child.once('error', (error) => {
      const code = (error as NodeJS.ErrnoException).code;
      finish(new Error(code === 'ENOENT' ? 'kinit is unavailable' : 'kinit could not be started'));
    });
    child.once('close', (code) => {
      finish(code === 0 ? undefined : new Error(`kinit exited with code ${code ?? 'unknown'}`));
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(`${password}\n`);
  });
};

const hasUsableKerberosTicket = async (cacheName: string): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const child = spawn('klist', ['-s', '-c', cacheName], {
      env: { ...process.env, KRB5CCNAME: cacheName },
      stdio: 'ignore',
      windowsHide: true,
    });
    let settled = false;
    const finish = (usable: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(usable);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(false);
    }, 5_000);
    child.once('error', () => finish(false));
    child.once('close', (code) => finish(code === 0));
  });

export async function ensureKerberosTicket(options: {
  username: string;
  password: string;
  realmHint?: string;
  force?: boolean;
}): Promise<string> {
  if (process.platform !== 'linux') return '';

  const principal = normalizeKerberosPrincipal(options.username, options.realmHint);
  if (!principal || !options.password) throw new Error('Kerberos service credentials are missing');

  if (
    !options.force &&
    ticketState?.principal === principal &&
    ticketState.refreshAt > Date.now()
  ) {
    try {
      await stat(ticketState.cacheName.replace(/^FILE:/, ''));
      if (await hasUsableKerberosTicket(ticketState.cacheName)) {
        process.env.KRB5CCNAME = ticketState.cacheName;
        return ticketState.cacheName;
      }
      ticketState = null;
    } catch {
      ticketState = null;
    }
  }

  if (ticketInFlight) return ticketInFlight;

  ticketInFlight = (async () => {
    const directory = path.join(os.homedir(), '.cache', 'roadmap');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await chmod(directory, 0o700);
    const uid = typeof process.getuid === 'function' ? process.getuid() : process.pid;
    const cachePath = path.join(directory, `krb5cc-${uid}`);
    const cacheName = `FILE:${cachePath}`;
    await rm(cachePath, { force: true });
    await runKinit(principal, options.password, cacheName);
    await chmod(cachePath, 0o600);
    process.env.KRB5CCNAME = cacheName;
    ticketState = {
      principal,
      cacheName,
      refreshAt: Date.now() + TICKET_REFRESH_MS,
    };
    return cacheName;
  })();

  try {
    return await ticketInFlight;
  } finally {
    ticketInFlight = null;
  }
}
