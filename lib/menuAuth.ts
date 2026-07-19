const AUTH_KEY = 'fw-menu-editor-auth';
const SECRET = process.env.MENU_EDITOR_SECRET?.trim() ?? 'finnegans-menu-editor';

function readEnvValue(key: string, fallback: string): string {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

export const MENU_EDITOR_EMAIL = readEnvValue('MENU_EDITOR_EMAIL', 'webadmin');
export const MENU_EDITOR_PASSWORD = readEnvValue('MENU_EDITOR_PASSWORD', 'webadmin');

export function validateCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();
  return normalizedEmail === MENU_EDITOR_EMAIL && normalizedPassword === MENU_EDITOR_PASSWORD;
}

interface SessionPayload {
  email: string;
  password: string;
  secret: string;
}

function parseSessionPayload(decoded: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (
      typeof parsed.email === 'string' &&
      typeof parsed.password === 'string' &&
      typeof parsed.secret === 'string'
    ) {
      return parsed;
    }
  } catch {
    // Legacy token format: email:password:secret
    const parts = decoded.split(':');
    if (parts.length >= 3) {
      return {
        email: parts[0],
        password: parts[1],
        secret: parts.slice(2).join(':'),
      };
    }
  }
  return null;
}

function toBase64Url(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64url');
  }
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

export function createSessionToken(email: string, password: string): string {
  const payload: SessionPayload = {
    email: email.trim(),
    password: password.trim(),
    secret: SECRET,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const decoded = fromBase64Url(token);
    const payload = parseSessionPayload(decoded);
    if (!payload || payload.secret !== SECRET) return false;
    return validateCredentials(payload.email, payload.password);
  } catch {
    return false;
  }
}

export function getStoredAuth(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(AUTH_KEY);
}

export function setStoredAuth(token: string): void {
  sessionStorage.setItem(AUTH_KEY, token);
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getStoredAuth();
  return token ? { 'x-menu-editor-token': token } : {};
}

/** Validate session on the server (password env vars are server-only). */
export async function verifySessionOnServer(): Promise<boolean> {
  const token = getStoredAuth();
  if (!token) return false;
  try {
    const res = await fetch('/api/menu-auth', {
      cache: 'no-store',
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function assertMenuEditorAuth(
  req: Pick<Request, 'headers'>,
  options?: { required?: boolean }
) {
  const envToken = process.env.MENU_EDITOR_TOKEN;
  const provided = req.headers.get('x-menu-editor-token') ?? '';

  if (envToken && provided === envToken) return;
  if (isValidSessionToken(provided)) return;
  if (!envToken && !provided && !options?.required) return;

  throw new Error('Unauthorized');
}
