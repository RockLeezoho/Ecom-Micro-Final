import torch

class LSTMModel:
    def __init__(self, model_path: str):
        self.model = torch.load(model_path)
        self.model.eval()

    def predict(self, user_id: str, user_history: list, product_encoder: dict, top_k: int = 10):
        """
        Dự đoán các sản phẩm phù hợp cho user dựa trên lịch sử tương tác và model LSTM.
        user_history: list các product_id user đã xem/mua (theo thứ tự thời gian)
        product_encoder: dict ánh xạ product_id -> index (dùng cho embedding)
        """
        import torch
        if not user_history:
            return {}
        # Encode lịch sử thành chỉ số
        seq = [product_encoder[pid] for pid in user_history if pid in product_encoder]
        if not seq:
            return {}
        input_tensor = torch.tensor(seq, dtype=torch.long).unsqueeze(0)  # shape: (1, seq_len)
        with torch.no_grad():
            scores = self.model(input_tensor)  # shape: (1, num_products)
            scores = scores.squeeze(0)
            topk = torch.topk(scores, k=min(top_k, scores.size(0)))
            idxs = topk.indices.tolist()
            vals = topk.values.tolist()
            # Map index -> product_id
            inv_encoder = {v: k for k, v in product_encoder.items()}
            result = {inv_encoder[i]: float(v) for i, v in zip(idxs, vals) if i in inv_encoder}
        return result
