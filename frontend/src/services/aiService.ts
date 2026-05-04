// Kết nối tới AI Service qua API Gateway
export const recommendProducts = async (user_id, history_prods, history_acts, user_query) => {
  const res = await fetch("/api/ai/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, history_prods, history_acts, user_query })
  });
  if (!res.ok) throw new Error("AI Service error");
  return res.json();
};

export const chatWithAIService = async (user_query) => {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_query })
  });
  if (!res.ok) throw new Error("AI Service error");
  return res.json();
};
