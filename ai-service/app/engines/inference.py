from app.engines.model_loader import ml_loader
import torch
import torch.nn.functional as F
import numpy as np
import logging

logger = logging.getLogger(__name__)

class InferenceEngine:
    
    @staticmethod
    def predict_lstm(history_prods, history_acts, top_k=10):
        """
        Dự đoán xác suất các sản phẩm tiếp theo bằng LSTM.
        history_prods: List[str] - Danh sách ID sản phẩm
        history_acts: List[str] - Danh sách hành động tương ứng
        """
        try:
            # 1. Tiền xử lý & Padding (Giả sử WINDOW_SIZE = 15)
            window_size = 15
            
            # Chỉ lấy 15 phần tử cuối
            history_prods = history_prods[-window_size:]
            history_acts = history_acts[-window_size:]
            
            # Encode chuỗi string sang index
            # Nếu gặp ID lạ (chưa có trong encoder), xử lý ngoại lệ hoặc bỏ qua
            p_idx = ml_loader.prod_enc.transform(history_prods)
            a_idx = ml_loader.act_enc.transform(history_acts)
            
            # Padding nếu chuỗi ngắn hơn window_size (thêm số 0 vào đầu)
            if len(p_idx) < window_size:
                pad_len = window_size - len(p_idx)
                p_idx = np.pad(p_idx, (pad_len, 0), 'constant', constant_values=0)
                a_idx = np.pad(a_idx, (pad_len, 0), 'constant', constant_values=0)
            
            # 2. Chuyển thành Tensor (Batch_size=1, Seq_len=15, Features=2)
            seq = np.stack((p_idx, a_idx), axis=1)
            seq_tensor = torch.LongTensor(seq).unsqueeze(0).to(ml_loader.device)
            
            # 3. Forward qua Model
            with torch.no_grad():
                logits = ml_loader.lstm_model(seq_tensor)
                # Tính xác suất bằng Softmax
                probs = F.softmax(logits, dim=1).squeeze(0)
                
            # 4. Lấy Top K sản phẩm
            top_probs, top_indices = torch.topk(probs, top_k)
            
            # Convert index ngược lại thành Product ID
            recommended_ids = ml_loader.prod_enc.inverse_transform(top_indices.cpu().numpy())
            scores = top_probs.cpu().numpy()
            
            return {str(pid): float(score) for pid, score in zip(recommended_ids, scores)}

        except Exception as e:
            logger.error(f"Lỗi trong predict_lstm: {e}")
            return {}

    @staticmethod
    def query_graph(user_id, last_prod_id):
        """
        Truy vấn Neo4j để lấy gợi ý dựa trên mối quan hệ (Collaborative Filtering trên Graph)
        """
        if not last_prod_id:
            return {}
            
        scores = {}
        # Query: Tìm những người dùng cũng xem sản phẩm này, xem họ xem thêm gì khác
        query = """
        MATCH (p:Product {id: $pid})<-[:VIEWED]-(u:User)-[:VIEWED]->(rec:Product)
        WHERE p <> rec
        RETURN rec.id AS id, count(u) AS weight
        ORDER BY weight DESC LIMIT 10
        """
        try:
            from app.settings import settings
            with ml_loader.graph_driver.session(database=settings.NEO4J_DATABASE) as session:
                result = session.run(query, pid=last_prod_id)
                records = list(result)
                
                if not records:
                    return {}
                
                # Normalize điểm dựa trên trọng số lớn nhất tìm được
                max_weight = max([r['weight'] for r in records])
                for r in records:
                    scores[str(r['id'])] = r['weight'] / max_weight
                    
            return scores
        except Exception as e:
            logger.error(f"Lỗi trong query_graph: {e}")
            return {}

    @staticmethod
    def retrieve_rag(query_text, n_results=5):
        """
        Truy vấn ChromaDB để tìm sản phẩm tương đồng về ngữ nghĩa
        """
        try:
            # 1. Tạo Embedding cho câu query từ người dùng
            query_embedding = ml_loader.embed_model.encode(query_text).tolist()
            
            # 2. Truy vấn Vector DB
            results = ml_loader.collection.query(
                query_embeddings=[query_embedding], 
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            # ChromaDB trả về distance (càng nhỏ càng giống), ta chuyển về score (càng lớn càng giống)
            # score = 1 / (1 + distance)
            processed_results = {
                "ids": results['ids'][0],
                "documents": results['documents'][0],
                "metadatas": results['metadatas'][0],
                "scores": [1 / (1 + d) for d in results['distances'][0]]
            }
            return processed_results
            
        except Exception as e:
            logger.error(f"Lỗi trong retrieve_rag: {e}")
            return {"ids": [], "documents": [], "metadatas": [], "scores": []}