import { getCustomerToken } from "./tokenStorage";

async function parsePayload(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.";
    throw new Error(message);
  }
  return payload;
}

export async function apiGet(baseUrl, path, params = {}) {
  const token = getCustomerToken();
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  const url = `${baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return parsePayload(response);
}

export async function apiPost(baseUrl, path, body) {
  return requestWithBody(baseUrl, path, "POST", body);
}

export async function apiPatch(baseUrl, path, body) {
  return requestWithBody(baseUrl, path, "PATCH", body);
}

export async function apiDelete(baseUrl, path) {
  const token = getCustomerToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  return parsePayload(response);
}

async function requestWithBody(baseUrl, path, method, body) {
  const token = getCustomerToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  return parsePayload(response);
}
