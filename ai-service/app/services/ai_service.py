from app.engines.inference import InferenceEngine
from app.engines.model_loader import ml_loader
import app.settings as settings

class AIService:
    def __init__(self):
        self.engine = InferenceEngine()

    def get_category_recommendations(self, category_key: str, limit: int = 10) -> list[str]:
        scores = self.engine.query_category_products(category_key, top_k=limit)
        return sorted(scores, key=scores.get, reverse=True)[:limit]

    async def get_recommendations(
        self,
        user_id,
        history_prods,
        history_acts,
        user_query=None,
        category_key=None,
        limit: int = 10,
    ) -> list[str]:
        if category_key:
            return self.get_category_recommendations(category_key, limit=limit)
        return await self.get_hybrid_recommendations(user_id, history_prods, history_acts, user_query)

    def get_related_products(self, product_id: str, limit: int = 10) -> list[str]:
        scores = self.engine.query_graph("anonymous", product_id)
        return sorted(scores, key=scores.get, reverse=True)[:limit]

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
        # 4. Tổng hợp điểm (Ranking)
        all_ids = list(set(lstm_res.keys()) | set(graph_res.keys()) | set(rag_res.keys()))
        
        meta_dict = {}
        try:
            chroma_res = ml_loader.collection.get(ids=all_ids, include=["metadatas"])
            if chroma_res and chroma_res.get('metadatas'):
                for i, doc_id in enumerate(chroma_res['ids']):
                    meta_dict[doc_id] = chroma_res['metadatas'][i]
        except Exception:
            pass

        final_rank = {}
        if ml_loader.xgboost_ranker is not None:
            import pandas as pd
            features_list = []
            for pid in all_ids:
                s_lstm = lstm_res.get(pid, 0)
                s_graph = graph_res.get(pid, 0)
                s_rag = rag_res.get(pid, 0)
                meta = meta_dict.get(pid, {})
                price = meta.get('price', 0.0)
                stock = meta.get('stock', 0)
                rating = meta.get('rating', 0.0)
                viewCount = meta.get('viewCount', 0)
                
                features_list.append({
                    'lstm_score': s_lstm,
                    'graph_score': s_graph,
                    'rag_score': s_rag,
                    'price': price,
                    'stock': stock,
                    'rating': rating,
                    'viewCount': viewCount
                })
            if len(features_list) > 0:
                df_features = pd.DataFrame(features_list)
                preds = ml_loader.xgboost_ranker.predict_proba(df_features)[:, 1]
                for i, pid in enumerate(all_ids):
                    final_rank[pid] = float(preds[i])
        else:
            w1 = getattr(settings, 'W1_LSTM', 0.5)
            w2 = getattr(settings, 'W2_GRAPH', 0.3)
            w3 = getattr(settings, 'W3_RAG', 0.2)
            for pid in all_ids:
                s_lstm = lstm_res.get(pid, 0)
                s_graph = graph_res.get(pid, 0)
                s_rag = rag_res.get(pid, 0)
                score = w1 * s_lstm + w2 * s_graph + w3 * s_rag
                final_rank[pid] = score
                
        sorted_ids = sorted(final_rank, key=final_rank.get, reverse=True)
        return sorted_ids[:10]

    async def chatbot_response(self, user_query: str, context_product_ids: list[str] = None):
        # 1. Retrieve
        rag_data = None
        
        # Nếu có context_product_ids, lấy trực tiếp thông tin các sản phẩm này làm ngữ cảnh
        if context_product_ids and len(context_product_ids) > 0:
            try:
                # Query ChromaDB by IDs
                chroma_res = ml_loader.collection.get(ids=context_product_ids, include=["documents", "metadatas"])
                if chroma_res and chroma_res.get('documents') and len(chroma_res['documents']) > 0:
                    rag_data = chroma_res
            except Exception:
                pass
                
        # Nếu không có context hoặc fetch lỗi, dùng RAG semantic search thông thường
        if not rag_data or not rag_data.get('documents'):
            rag_data = self.engine.retrieve_rag(user_query)
            
        if rag_data and rag_data.get('documents') and len(rag_data['documents']) > 0 and rag_data['documents'][0]:
            # ChromaDB .get() returns a 1D list for documents, but query() returns a 2D list.
            # Handle both formats
            if isinstance(rag_data['documents'][0], list):
                docs = rag_data['documents'][0]
                metas = rag_data.get('metadatas', [[]])[0] if rag_data.get('metadatas') else []
                context = ml_loader._build_context(docs, metas)
                prod_id = rag_data['ids'][0][0] if rag_data.get('ids') and len(rag_data['ids']) > 0 and len(rag_data['ids'][0]) > 0 else None
            else:
                docs = rag_data['documents']
                metas = rag_data.get('metadatas', []) if rag_data.get('metadatas') else []
                context = ml_loader._build_context(docs, metas)
                prod_id = rag_data['ids'][0] if rag_data.get('ids') and len(rag_data['ids']) > 0 else None
        else:
            context = ""
            prod_id = None

        system_prompt = (
            "Bạn là trợ lý mua sắm của cửa hàng. "
            "Quy tắc bắt buộc:\n"
            "1. LUÔN trả lời bằng tiếng Việt, không dùng ngôn ngữ khác.\n"
            "2. CHỈ gợi ý các sản phẩm có trong PHẦN NGỮ CẢNH được cung cấp. "
            "TUYỆT ĐỐI KHÔNG được bịa đặt, suy diễn hoặc đề xuất sản phẩm không có trong ngữ cảnh.\n"
            "3. Nếu ngữ cảnh không có sản phẩm liên quan, hãy trả lời: "
            "'Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể thử từ khóa khác.'\n"
            "4. Trả lời ngắn gọn, thân thiện, không thêm thông tin ngoài ngữ cảnh."
        )
        if context:
            user_prompt = (
                f"Câu hỏi của khách: {user_query}\n\n"
                f"Sản phẩm trong hệ thống (chỉ dùng những sản phẩm này):\n{context}"
            )
        else:
            user_prompt = (
                f"Câu hỏi của khách: {user_query}\n\n"
                "Ngữ cảnh: Không tìm thấy sản phẩm phù hợp trong hệ thống."
            )

        llm_answer = ml_loader.generate_llm_response(system_prompt, user_prompt)
        if llm_answer:
            answer = llm_answer
        else:
            answer = "Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể thử từ khóa khác."

        return answer, [str(prod_id)] if prod_id is not None else []

# python -m tests.test_ai_service