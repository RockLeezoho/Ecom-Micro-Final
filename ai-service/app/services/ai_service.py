from app.engines.inference import InferenceEngine
import app.settings as settings

class AIService:
    def __init__(self):
        self.engine = InferenceEngine()

    async def get_hybrid_recommendations(self, user_id, history_prods, history_acts, user_query=None):
        """
        Kết hợp LSTM, Graph, RAG để đề xuất sản phẩm:
        final_score = w1*lstm + w2*graph + w3*rag
        """
        # 1. LSTM: dự đoán hành vi
        lstm_res = self.engine.predict_lstm(history_prods, history_acts)
        # 2. Graph: sản phẩm liên quan
        last_pid = history_prods[-1] if history_prods else None
        graph_res = self.engine.query_graph(user_id, last_pid)
        # 3. RAG: semantic search nếu có user_query
        rag_res = {}
        if user_query:
            rag_data = self.engine.retrieve_rag(user_query)
            for pid, score in zip(rag_data['ids'], rag_data['scores']):
                rag_res[str(pid)] = score
        # 4. Tổng hợp điểm
        w1 = getattr(settings, 'W1_LSTM', 0.5)
        w2 = getattr(settings, 'W2_GRAPH', 0.3)
        w3 = getattr(settings, 'W3_RAG', 0.2)
        all_ids = set(lstm_res.keys()) | set(graph_res.keys()) | set(rag_res.keys())
        final_rank = {}
        for pid in all_ids:
            s_lstm = lstm_res.get(pid, 0)
            s_graph = graph_res.get(pid, 0)
            s_rag = rag_res.get(pid, 0)
            score = w1 * s_lstm + w2 * s_graph + w3 * s_rag
            final_rank[pid] = score
        sorted_ids = sorted(final_rank, key=final_rank.get, reverse=True)
        return sorted_ids[:10]

    async def chatbot_response(self, user_query: str):
        # 1. Retrieve
        rag_data = self.engine.retrieve_rag(user_query)
        if rag_data.get('documents') and len(rag_data['documents']) > 0 and rag_data['documents'][0]:
            context = " ".join(rag_data['documents'][0])
            answer = f"Dựa trên yêu cầu của bạn, tôi tìm thấy: {context[:100]}..."
            prod_id = rag_data['ids'][0] if rag_data.get('ids') and len(rag_data['ids']) > 0 else None
        else:
            answer = "Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp với yêu cầu của bạn."
            prod_id = None
        return answer, [str(prod_id)] if prod_id is not None else []

# python -m tests.test_ai_service