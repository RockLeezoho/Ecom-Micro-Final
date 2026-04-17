const KEY = "stationery_customer_checkout_selection";

export function saveCheckoutSelection(productIds) {
  localStorage.setItem(KEY, JSON.stringify(productIds));
}

export function loadCheckoutSelection() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearCheckoutSelection() {
  localStorage.removeItem(KEY);
}
