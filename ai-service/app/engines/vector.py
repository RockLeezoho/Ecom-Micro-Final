# ChromaDB logic
class VectorEngine:
    def __init__(self, db_path: str):
        # Giả sử db_path là file chứa dict {product_id: embedding}
        import pickle
        with open(db_path, "rb") as f:
            self.product_vectors = pickle.load(f)  # {product_id: np.array}
        # Đảm bảo tất cả embedding là numpy array
        import numpy as np
        for k, v in self.product_vectors.items():
            if not isinstance(v, np.ndarray):
                self.product_vectors[k] = np.array(v)

    def search(self, query: str, embed_func=None, top_k: int = 10):
        """
        Tìm kiếm sản phẩm gần nhất với query dựa trên embedding cosine similarity.
        embed_func: hàm chuyển query -> vector (numpy array)
        """
        import numpy as np
        if embed_func is None:
            raise ValueError("embed_func (query->vector) phải được cung cấp")
        q_vec = embed_func(query)
        sims = {}
        for pid, vec in self.product_vectors.items():
            # Chuẩn hóa vector
            if np.linalg.norm(vec) == 0 or np.linalg.norm(q_vec) == 0:
                sims[pid] = 0.0
            else:
                sims[pid] = float(np.dot(q_vec, vec) / (np.linalg.norm(q_vec) * np.linalg.norm(vec)))
        # Sắp xếp theo độ tương đồng giảm dần
        top = sorted(sims.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [pid for pid, score in top if score > 0]
