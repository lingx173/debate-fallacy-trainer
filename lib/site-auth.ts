/** Shared site password gate (Option A — middleware + cookie). */

export const SITE_AUTH_COOKIE = 'ff_site_auth';
export const SITE_AUTH_PAYLOAD = 'fallacy-forum-site-auth-v1';
/** 30 days */
export const SITE_AUTH_MAX_AGE = 60 * 60 * 24 * 30;

export function isSiteGateEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD?.length);
}

function getSigningSecret(): string | null {
  const secret = process.env.SITE_AUTH_SECRET || process.env.SITE_PASSWORD;
  return secret && secret.length > 0 ? secret : null;
}

async function sign(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(SITE_AUTH_PAYLOAD));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSiteAuthToken(): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) throw new Error('SITE_PASSWORD is not configured');
  return sign(secret);
}

export async function verifySiteAuthToken(token: string | undefined): Promise<boolean> {
  if (!token || !isSiteGateEnabled()) return !isSiteGateEnabled();
  const secret = getSigningSecret();
  if (!secret) return false;
  const expected = await sign(secret);
  return timingSafeEqualString(token, expected);
}

/** Constant-time string compare (Edge-safe). */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time password check (Node API routes). */
export function verifySitePassword(candidate: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
