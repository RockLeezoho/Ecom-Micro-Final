const KEY = "stationery_customer_access_token";

export function saveCustomerToken(token) {
  localStorage.setItem(KEY, token);
}

export function getCustomerToken() {
  return localStorage.getItem(KEY);
}

export function clearCustomerToken() {
  localStorage.removeItem(KEY);
}
