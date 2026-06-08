const AUTH_EXPIRED_EVENT = 'auth:expired';
const SKIP_INTERCEPTOR_HEADER = 'X-Skip-Auth-Interceptor';
const SESSION_STORAGE_KEY = 'becshop.session';
const EXPIRY_SKEW_SECONDS = 30;

type FetchLike = typeof fetch;

let installed = false;
let originalFetch: FetchLike | null = null;
let authExpiredNotified = false;

type SessionShape = {
  access?: string;
};

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    return JSON.parse(base64UrlDecode(parts[1])) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + EXPIRY_SKEW_SECONDS;
}

function getStoredAccessToken() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionShape;
    return session.access ?? null;
  } catch {
    return null;
  }
}

function shouldIgnoreUnauthorized(url: string, init?: RequestInit) {
  if (init?.headers) {
    const headers = new Headers(init.headers);
    if (headers.get(SKIP_INTERCEPTOR_HEADER) === '1') {
      return true;
    }
  }

  return (
    url.includes('/auth/login/') ||
    url.includes('/auth/logout/') ||
    url.includes('/auth/register/') ||
    url.includes('/register/')
  );
}

function dispatchAuthExpired(url: string) {
  authExpiredNotified = true;
  window.dispatchEvent(
    new CustomEvent(AUTH_EXPIRED_EVENT, {
      detail: { url },
    })
  );
}

function makeUnauthorizedResponse(message: string) {
  return new Response(JSON.stringify({ detail: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function maybeExpireSessionBeforeRequest(url: string, init?: RequestInit) {
  if (typeof window === 'undefined') {
    return null;
  }

  if (shouldIgnoreUnauthorized(url, init)) {
    return null;
  }

  const headers = new Headers(init?.headers);
  const authHeader = headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : getStoredAccessToken();

  if (!token) {
    return null;
  }

  if (!isTokenExpired(token)) {
    authExpiredNotified = false;
    return null;
  }

  if (!authExpiredNotified) {
    dispatchAuthExpired(url);
  }

  return makeUnauthorizedResponse('JWT token đã hết hạn');
}

export function installAuthInterceptor() {
  if (installed || typeof window === 'undefined') {
    return;
  }

  originalFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
    const expiredResponse = maybeExpireSessionBeforeRequest(url, init);
    if (expiredResponse) {
      return expiredResponse;
    }

    const response = await originalFetch!(input as Parameters<FetchLike>[0], init);

    if (response.status === 401 && !shouldIgnoreUnauthorized(url, init)) {
      if (window.localStorage.getItem('becshop.session')) {
        dispatchAuthExpired(url);
      }
    }

    return response;
  }) as FetchLike;

  installed = true;
}

export function getAuthExpiredEventName() {
  return AUTH_EXPIRED_EVENT;
}
