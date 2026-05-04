const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errBody = json || { message: res.statusText };
    const err: any = new Error(errBody.message || 'Request failed');
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return json;
}

export async function get(path: string, opts: RequestInit = {}) {
  return request(path, { ...opts, method: 'GET' });
}

export async function post(path: string, body: any, opts: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  return request(path, { ...opts, method: 'POST', headers, body: JSON.stringify(body) });
}

export async function put(path: string, body: any, opts: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  return request(path, { ...opts, method: 'PUT', headers, body: JSON.stringify(body) });
}

export default { get, post, put };
