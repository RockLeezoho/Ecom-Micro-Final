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
        # 1. Luôn dùng RAG semantic search để tìm sản phẩm liên quan đến câu hỏi hiện tại
        rag_data = self.engine.retrieve_rag(user_query)
        docs = []
        metas = []
        prod_ids = []
        
        if rag_data and rag_data.get('documents') and len(rag_data['documents']) > 0 and rag_data['documents'][0]:
            if isinstance(rag_data['documents'][0], list):
                docs.extend(rag_data['documents'][0])
                metas.extend(rag_data.get('metadatas', [[]])[0] if rag_data.get('metadatas') else [])
                prod_ids.extend(rag_data['ids'][0][:5] if rag_data.get('ids') and len(rag_data['ids']) > 0 else [])
            else:
                docs.extend(rag_data['documents'])
                metas.extend(rag_data.get('metadatas', []) if rag_data.get('metadatas') else [])
                prod_ids.extend(rag_data['ids'][:5] if rag_data.get('ids') else [])
        
        # Nếu có context_product_ids từ lịch sử chat, lấy thêm để làm ngữ cảnh phụ (nếu user hỏi tiếp về chúng)
        if context_product_ids and len(context_product_ids) > 0:
            try:
                new_ids = [pid for pid in context_product_ids if pid not in prod_ids]
                if new_ids:
                    chroma_res = ml_loader.collection.get(ids=new_ids, include=["documents", "metadatas"])
                    if chroma_res and chroma_res.get('documents') and len(chroma_res['documents']) > 0:
                        docs.extend(chroma_res['documents'])
                        metas.extend(chroma_res.get('metadatas', []))
                        prod_ids.extend(chroma_res['ids'])
            except Exception:
                pass
                
        context = ml_loader._build_context(docs, metas) if docs else ""

        system_prompt = (
            "Bạn là nhân viên tư vấn bán hàng nhiệt tình và khéo léo của BECShop. "
            "Quy tắc bắt buộc:\n"
            "1. LUÔN trả lời bằng tiếng Việt, giọng điệu thân thiện, tự nhiên như người thật đang tư vấn.\n"
            "2. CHỈ giới thiệu các sản phẩm CÓ TRONG PHẦN NGỮ CẢNH. Không bịa đặt sản phẩm ngoài hệ thống.\n"
            "3. Nếu khách hỏi một sản phẩm KHÔNG CÓ trong ngữ cảnh (chẳng hạn khách hỏi 'Điện thoại Apple' nhưng ngữ cảnh chỉ có 'Điện thoại Samsung'), "
            "đừng trả lời cứng nhắc là 'lỗi hệ thống'. Hãy khéo léo xin lỗi khách rằng cửa hàng đang tạm hết hàng hoặc ngừng kinh doanh sản phẩm đó, "
            "VÀ NGAY LẬP TỨC gợi ý các sản phẩm có trong ngữ cảnh như một sự thay thế hấp dẫn.\n"
            "4. Trả lời ngắn gọn, súc tích (dưới 4 câu)."
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
            answer = "Dạ hiện tại bên em đang tạm hết món này mất rồi ạ. Anh/chị có muốn tham khảo thêm các mẫu khác đang bán chạy ở shop không ạ?"

        return answer, [str(pid) for pid in prod_ids]

# python -m tests.test_ai_service