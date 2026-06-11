import os
import logging
from typing import Iterable

import chromadb
import joblib
import torch
import torch.nn as nn
from neo4j import GraphDatabase
from openai import OpenAI
from sentence_transformers import SentenceTransformer

import app.settings as settings

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. KIẾN TRÚC MÔ HÌNH LSTM (Chính xác từ file test của bạn) ---
class BehaviorLSTM(nn.Module):
    def __init__(self, num_prods, num_acts, embed_dim, hidden_dim, n_layers, dropout):
        super().__init__()
        self.prod_embed = nn.Embedding(num_prods, embed_dim)
        self.act_embed = nn.Embedding(num_acts, embed_dim)
        
        # Lưu ý: dropout chỉ có tác dụng khi n_layers > 1 trong nn.LSTM
        self.lstm = nn.LSTM(
            embed_dim * 2, 
            hidden_dim, 
            num_layers=n_layers, 
            batch_first=True, 
            dropout=dropout if n_layers > 1 else 0
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_prods)
        )
        
    def forward(self, x):
        # x shape: (batch, seq_len, 2)
        p_emb = self.prod_embed(x[:, :, 0])
        a_emb = self.act_embed(x[:, :, 1])
        combined = torch.cat((p_emb, a_emb), dim=2)
        
        lstm_out, _ = self.lstm(combined)
        # Lấy output tại timestep cuối cùng
        return self.fc(lstm_out[:, -1, :])

# --- 2. CLASS MODEL LOADER (Microservice Engine) ---
class ModelLoader:
    def __init__(self):
        skip_model_load = os.getenv("AI_SERVICE_SKIP_MODEL_LOAD", "0").lower() in {"1", "true", "yes"}
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Đang khởi tạo AI Engine trên thiết bị: {self.device}")

        self.llm_client = None
        self.llm_model = os.getenv("GROQ_MODEL", "qwen/qwen3-32b")
        self.llm_base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

        if skip_model_load:
            logger.info("AI_SERVICE_SKIP_MODEL_LOAD đã bật, bỏ qua khởi tạo model/Neo4j/Chroma thực tế.")
            self.prod_enc = None
            self.act_enc = None
            self.num_prods = 0
            self.num_acts = 0
            self.lstm_params = {}
            self.lstm_model = None
            self.graph_driver = None
            self.chroma_client = None
            self.collection = None
            self.embed_model = None
            self.llm_client = None
            return
        
        try:
            # A. LOAD ENCODERS
            self.prod_enc = joblib.load(settings.PROD_ENC_PATH)
            self.act_enc = joblib.load(settings.ACT_ENC_PATH)
            self.num_prods = len(self.prod_enc.classes_)
            self.num_acts = len(self.act_enc.classes_)
            logger.info("Đã load Encoders thành công.")

            # B. KHỞI TẠO LSTM TỪ CHECKPOINT ĐÃ HUẤN LUYỆN
            try:
                state_dict = torch.load(settings.MODEL_PATH, map_location="cpu")
            except Exception as e:
                logger.error(f"Không thể load checkpoint từ {settings.MODEL_PATH}: {e}")
                raise

            embed_dim = state_dict["prod_embed.weight"].shape[1]
            hidden_dim = state_dict["lstm.weight_hh_l0"].shape[1]
            n_layers = max(
                1,
                len(
                    {
                        key.split(".")[1]
                        for key in state_dict
                        if key.startswith("lstm.weight_hh_")
                    }
                ),
            )
            dropout = 0.0

            self.lstm_params = {
                "embed_dim": int(embed_dim),
                "hidden_dim": int(hidden_dim),
                "n_layers": int(n_layers),
                "dropout": float(dropout),
            }

            self.lstm_model = BehaviorLSTM(
                num_prods=self.num_prods,
                num_acts=self.num_acts,
                **self.lstm_params,
            ).to(self.device)

            try:
                self.lstm_model.load_state_dict(state_dict)
                logger.info(
                    "Đã load LSTM model thành công từ %s | params=%s",
                    settings.MODEL_PATH,
                    self.lstm_params,
                )
            except RuntimeError as e:
                logger.warning(
                    "Không thể load checkpoint (mismatch architecture): %s. Sử dụng model với random weights.",
                    str(e),
                )
            
            self.lstm_model.eval() # Chế độ dự đoán

            # C. KẾT NỐI NEO4J (Graph Database)
            self.graph_driver = GraphDatabase.driver(
                settings.NEO4J_URI, 
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            )
            self.graph_driver.verify_connectivity(database=settings.NEO4J_DATABASE)
            logger.info("Đã kết nối thành công tới Neo4j.")

            # D. KẾT NỐI CHROMADB & EMBEDDING (RAG)
            self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
            self.collection = self.chroma_client.get_or_create_collection(name="products")
            
            # Embedding model cho RAG và Chatbot
            self.embed_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self.embed_model.to(self.device)
            logger.info(f"Đã load Embedding model: {settings.EMBEDDING_MODEL}")

            # E. KHỞI TẠO LLM (Groq OpenAI-compatible)
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.llm_client = OpenAI(api_key=api_key, base_url=self.llm_base_url)
                logger.info(f"Đã khởi tạo LLM client: {self.llm_model}")
            else:
                logger.warning("GROQ_API_KEY chưa được thiết lập, LLM sẽ bị vô hiệu hóa.")

        except Exception as e:
            logger.error(f"Lỗi khởi tạo AI Engines: {str(e)}")
            raise e
            
        # F. KHỞI TẠO XGBOOST RANKER
        import xgboost as xgb
        self.xgboost_ranker = None
        try:
            ranker_path = os.path.join(settings.BASE_DIR, "models", "xgboost_ranker.json")
            if os.path.exists(ranker_path):
                self.xgboost_ranker = xgb.XGBClassifier()
                self.xgboost_ranker.load_model(ranker_path)
                logger.info(f"Đã load XGBoost Ranker từ {ranker_path}")
            else:
                logger.warning(f"Không tìm thấy mô hình XGBoost tại {ranker_path}")
        except Exception as e:
            logger.error(f"Lỗi load XGBoost Ranker: {str(e)}")

    def get_recommendation(self, user_id: str):
        """
        1. LSTM: Dự đoán xác suất sản phẩm user sẽ tương tác/mua
        2. Neo4j: Lấy sản phẩm liên quan từ Knowledge Graph
        3. ChromaDB: Lấy sản phẩm gần nhất theo vector embedding
        4. Tính điểm hybrid: final_score = w1*lstm + w2*graph + w3*rag
        """
        history_prods, history_acts, last_product_name = self._get_user_history_from_graph(user_id)

        lstm_score = self._predict_lstm_scores(history_prods, history_acts)
        graph_products = self._get_graph_related_products(user_id)
        rag_products = self._get_rag_related_products(user_id, last_product_name)

        w1, w2, w3 = settings.W1_LSTM, settings.W2_GRAPH, settings.W3_RAG
        all_products = set(lstm_score.keys()) | graph_products | rag_products
        scored = []
        for pid in all_products:
            s1 = lstm_score.get(pid, 0.0)
            s2 = 1.0 if pid in graph_products else 0.0
            s3 = 1.0 if pid in rag_products else 0.0
            final = w1 * s1 + w2 * s2 + w3 * s3
            scored.append((pid, final))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scored[:3]]

    def chatbot_response(self, query: str):
        """
        1. Embed query
        2. Retrieve sản phẩm liên quan từ ChromaDB
        3. Sinh câu trả lời dựa trên kết quả (LLM thật)
        """
        try:
            query_emb = self.embed_model.encode([query])
            results = self.collection.query(
                query_embeddings=query_emb,
                n_results=3,
                include=["documents", "metadatas"],
            )
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            context = self._build_context(docs, metas)

            system_prompt = (
                "Bạn là trợ lý mua sắm của cửa hàng. "
                "Quy tắc bắt buộc:\n"
                "1. LUÔN trả lời bằng tiếng Việt, không dùng ngôn ngữ khác.\n"
                "2. CHỈ gợi ý các sản phẩm có trong PHẦN NGỮ CẢNH được cung cấp. "
                "TUYỆT ĐỐI KHÔNG được bịa đặt, suy diễn hoặc đề xuất sản phẩm không có trong ngữ cảnh.\n"
                "3. Nếu ngữ cảnh không có sản phẩm liên quan, hãy trả lời: "
                "'Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. "
                "Bạn có thể thử từ khóa khác.'\n"
                "4. Trả lời ngắn gọn, thân thiện, không thêm thông tin ngoài ngữ cảnh."
            )
            if context:
                user_prompt = (
                    f"Câu hỏi của khách: {query}\n\n"
                    f"Sản phẩm trong hệ thống (chỉ dùng những sản phẩm này):\n{context}"
                )
            else:
                user_prompt = (
                    f"Câu hỏi của khách: {query}\n\n"
                    "Ngữ cảnh: Không tìm thấy sản phẩm phù hợp trong hệ thống."
                )

            llm_answer = self.generate_llm_response(system_prompt, user_prompt)
            response = llm_answer or "Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp trong hệ thống. Bạn có thể thử từ khóa khác."
        except Exception as e:
            logger.warning(f"Chatbot RAG failed: {e}")
            response = "Xin lỗi, tôi chưa tìm thấy sản phẩm phù hợp."
        return response

    def _get_user_history_from_graph(self, user_id: str, limit: int = 50):
        if not self.graph_driver:
            return [], [], None

        action_map = {
            "SEARCH": "search",
            "VIEW": "view_product",
            "ENGAGED": "stay_duration",
            "FILTER_SORT": "filter_sort",
            "WISHLIST": "wishlist_add",
            "ADD_TO_CART": "add_to_cart",
            "PURCHASE": "purchase",
            "REMOVE_FROM_CART": "remove_from_cart",
        }

        rel_types = "|".join(action_map.keys())
        query = f"""
        MATCH (u:User {{id: $user_id}})-[r:{rel_types}]->(p:Product)
        RETURN p.id AS pid, p.name AS name, type(r) AS rel, r.time AS time
        ORDER BY toInteger(r.time) DESC
        LIMIT $limit
        """

        history_prods = []
        history_acts = []
        last_product_name = None

        try:
            with self.graph_driver.session(database=settings.NEO4J_DATABASE) as session:
                result = session.run(query, user_id=user_id, limit=limit)
                rows = list(result)

            for row in reversed(rows):
                pid = str(row.get("pid"))
                rel = row.get("rel")
                act = action_map.get(rel)
                if pid and act:
                    history_prods.append(pid)
                    history_acts.append(act)

            if rows:
                last_product_name = rows[0].get("name")

        except Exception as e:
            logger.warning(f"Neo4j history query failed: {e}")

        return history_prods, history_acts, last_product_name

    def _predict_lstm_scores(self, history_prods: Iterable[str], history_acts: Iterable[str], window_size: int = 15):
        import numpy as np
        if not history_prods or not history_acts:
            return {}

        history_prods = list(history_prods)[-window_size:]
        history_acts = list(history_acts)[-window_size:]

        try:
            p_idx = self.prod_enc.transform(history_prods)
            a_idx = self.act_enc.transform(history_acts)
        except Exception as e:
            logger.warning(f"Encoder transform failed: {e}")
            return {}

        if len(p_idx) < window_size:
            pad_len = window_size - len(p_idx)
            p_idx = np.pad(p_idx, (pad_len, 0), 'constant', constant_values=0)
            a_idx = np.pad(a_idx, (pad_len, 0), 'constant', constant_values=0)

        seq = np.stack((p_idx, a_idx), axis=1)
        seq_tensor = torch.LongTensor(seq).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.lstm_model(seq_tensor)
            probs = torch.softmax(logits, dim=1).squeeze(0)

        top_probs, top_indices = torch.topk(probs, k=min(50, len(probs)))
        recommended_ids = self.prod_enc.inverse_transform(top_indices.cpu().numpy())
        scores = top_probs.cpu().numpy()
        return {str(pid): float(score) for pid, score in zip(recommended_ids, scores)}

    def _get_graph_related_products(self, user_id: str, limit: int = 10):
        if not self.graph_driver:
            return set()

        query = """
        MATCH (u:User {id: $user_id})-[r:VIEW|PURCHASE|ADD_TO_CART|WISHLIST]->(p:Product)
        OPTIONAL MATCH (p)-[:SIMILAR]->(sim:Product)
        WITH collect(DISTINCT p.id) + collect(DISTINCT sim.id) AS ids
        UNWIND ids AS pid
        RETURN pid AS id
        LIMIT $limit
        """

        try:
            with self.graph_driver.session(database=settings.NEO4J_DATABASE) as session:
                result = session.run(query, user_id=user_id, limit=limit)
                return {str(r["id"]) for r in result if r.get("id")}
        except Exception as e:
            logger.warning(f"Neo4j related query failed: {e}")
            return set()

    def _get_rag_related_products(self, user_id: str, last_product_name: str | None, limit: int = 10):
        if not self.collection or not self.embed_model:
            return set()

        query_text = last_product_name or f"Người dùng {user_id}"
        try:
            query_emb = self.embed_model.encode([query_text])
            results = self.collection.query(query_embeddings=query_emb, n_results=limit)
            return {str(pid) for pid in results.get("ids", [[]])[0]}
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}")
            return set()

    def _build_context(self, documents: list[str] | None, metadatas: list[dict] | None) -> str:
        documents = documents or []
        metadatas = metadatas or []
        context_parts = []
        for idx, doc in enumerate(documents):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            name = meta.get("name") or meta.get("title") or ""
            category = meta.get("category") or ""
            price = meta.get("price", 0)
            brand = meta.get("brand", "")
            model_info = meta.get("model", "")
            color = meta.get("color", "")
            material = meta.get("material", "")
            condition = meta.get("condition", "")
            
            snippet = doc.strip().replace("\n", " ") if doc else ""
            
            extra_info = []
            if price: extra_info.append(f"Giá: {price}")
            if brand: extra_info.append(f"Hãng: {brand}")
            if model_info: extra_info.append(f"Model: {model_info}")
            if color: extra_info.append(f"Màu: {color}")
            if material: extra_info.append(f"Chất liệu: {material}")
            if condition: extra_info.append(f"Tình trạng: {condition}")
            
            extra_str = " | ".join(extra_info)
            if name or category or snippet or extra_str:
                context_parts.append(" | ".join(part for part in [name, category, snippet, extra_str] if part))
        return "\n".join(context_parts)

    def generate_llm_response(self, system_prompt: str, user_prompt: str) -> str | None:
        if not self.llm_client:
            return None

        response = self.llm_client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        message = response.choices[0].message.content
        if not message:
            return None

        # Strip <think>...</think> reasoning blocks (produced by Qwen3 and other
        # chain-of-thought models). The flag re.DOTALL makes '.' match newlines too.
        import re
        message = re.sub(r"<think>.*?</think>", "", message, flags=re.DOTALL)
        message = re.sub(r"<think>.*", "", message, flags=re.DOTALL)
        cleaned = message.strip()
        return cleaned if cleaned else None
    def close(self):
        """Đóng các kết nối khi dừng service"""
        if self.graph_driver:
            self.graph_driver.close()
            logger.info("Đã đóng driver Neo4j.")

# Khởi tạo Singleton để sử dụng trong toàn ứng dụng
ml_loader = ModelLoader()