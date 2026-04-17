import { apiPost } from "./apiClient";

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL ?? "http://localhost:8010/api/v1";
const DEFAULT_EVENT_VERSION = "v1";

export async function suggestAiProducts({ message, topK = 5, sessionId } = {}) {
  const payload = await apiPost(AI_API_BASE_URL, "/ai/chat-suggest", {
    message,
    top_k: topK,
    ...(sessionId ? { session_id: sessionId } : {})
  });

  return {
    answer: payload.data?.answer ?? "",
    recommendations: payload.data?.recommendations ?? [],
    contextSummary: payload.data?.context_summary ?? "",
    usedFallback: Boolean(payload.data?.used_fallback)
  };
}

export async function trackBehaviorEvent(event) {
  const payload = buildBehaviorEventPayload(event);
  if (!payload) {
    return;
  }

  try {
    await apiPost(AI_API_BASE_URL, "/ai/behavior-events", payload);
  } catch {
    // Behavior tracking must not interrupt user flow.
  }
}

function buildBehaviorEventPayload(event) {
  if (!event || typeof event !== "object" || !event.event_type) {
    return null;
  }

  const metadata = toStandardMetadata(event);
  return {
    event_type: event.event_type,
    ...(event.product_id ? { product_id: event.product_id } : {}),
    ...(event.category_id ? { category_id: event.category_id } : {}),
    ...(event.search_keyword ? { search_keyword: event.search_keyword } : {}),
    ...(event.price !== undefined ? { price: Number(event.price) } : {}),
    ...(event.rating !== undefined ? { rating: Number(event.rating) } : {}),
    ...(event.review_text ? { review_text: event.review_text } : {}),
    ...(event.time_spent_seconds !== undefined ? { time_spent_seconds: Number(event.time_spent_seconds) } : {}),
    ...(event.occurred_at ? { occurred_at: event.occurred_at } : {}),
    metadata
  };
}

function toStandardMetadata(event) {
  const common = {
    event_version: DEFAULT_EVENT_VERSION,
    source: "customer-app",
    platform: typeof navigator !== "undefined" ? "web" : "unknown",
    page: event.page || (typeof window !== "undefined" ? window.location.pathname : "unknown"),
    session_id: event.session_id || getSessionId(),
    ...sanitizeObject(event.metadata)
  };

  if (event.event_type === "purchase") {
    return sanitizeObject({
      ...common,
      order_id: event.order_id,
      shipping_method: event.shipping_method,
      payment_method: event.payment_method,
      total_amount: event.total_amount,
      quantity: event.quantity,
      currency: event.currency || "VND"
    });
  }

  if (event.event_type === "search") {
    return sanitizeObject({
      ...common,
      result_count: event.result_count
    });
  }

  if (event.event_type === "add_to_cart") {
    return sanitizeObject({
      ...common,
      quantity: event.quantity || 1
    });
  }

  if (event.event_type === "product_click" || event.event_type === "product_view") {
    return sanitizeObject({
      ...common,
      position: event.position
    });
  }

  if (event.event_type === "rating_review") {
    return sanitizeObject({
      ...common,
      order_id: event.order_id
    });
  }

  return sanitizeObject(common);
}

function sanitizeObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ""));
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }
  const key = "stationery_ai_session_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, created);
  return created;
}
