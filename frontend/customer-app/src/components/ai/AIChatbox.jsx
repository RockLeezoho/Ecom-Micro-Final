import { useMemo, useState } from "react";

import { suggestAiProducts } from "../../services/aiService";

function createMessage(role, content, recommendations = []) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    recommendations
  };
}

const INITIAL_MESSAGE = createMessage(
  "assistant",
  "Chao ban! Minh la tro ly goi y van phong pham. Hay mo ta nhu cau de minh goi y nhanh hon."
);

export function AIChatbox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [error, setError] = useState("");

  const sessionId = useMemo(() => {
    return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) {
      return;
    }

    const userMessage = createMessage("user", text);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");

    try {
      setLoading(true);
      const response = await suggestAiProducts({
        message: text,
        topK: 5,
        sessionId
      });
      const assistantMessage = createMessage(
        "assistant",
        response.answer || "Minh chua co goi y phu hop ngay luc nay.",
        response.recommendations
      );
      setMessages((current) => [...current, assistantMessage]);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`ai-chatbox ${open ? "ai-chatbox-open" : ""}`}>
      <button type="button" className="ai-chatbox-toggle" onClick={() => setOpen((value) => !value)}>
        {open ? "Dong AI" : "Chat AI"}
      </button>

      {open ? (
        <section className="ai-chatbox-panel">
          <header className="ai-chatbox-header">
            <h3>AI Tu van san pham</h3>
            <p>Goi y dua tren hanh vi tim kiem va mua sam cua ban.</p>
          </header>

          <div className="ai-chatbox-messages">
            {messages.map((message) => (
              <article key={message.id} className={`ai-bubble ai-bubble-${message.role}`}>
                <p>{message.content}</p>
                {message.recommendations.length > 0 ? (
                  <ul className="ai-recommend-list">
                    {message.recommendations.map((item) => (
                      <li key={`${message.id}-${item.product_id}`}>
                        <strong>{item.name}</strong> ({Number(item.price || 0).toLocaleString("vi-VN")} đ)
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          {error ? <p className="field-error">{error}</p> : null}

          <form className="ai-chatbox-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="field-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Vi du: Goi y but ky cho ghi chu nhanh"
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={loading || !input.trim()}>
              {loading ? "Dang xu ly..." : "Gui"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
