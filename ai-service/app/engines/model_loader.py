import torch
import torch.nn as nn
import joblib
import chromadb
import logging
from neo4j import GraphDatabase
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
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Đang khởi tạo AI Engine trên thiết bị: {self.device}")
        
        try:
            # A. LOAD ENCODERS
            self.prod_enc = joblib.load(settings.PROD_ENC_PATH)
            self.act_enc = joblib.load(settings.ACT_ENC_PATH)
            self.num_prods = len(self.prod_enc.classes_)
            self.num_acts = len(self.act_enc.classes_)
            logger.info("Đã load Encoders thành công.")

            # B. KHỞI TẠO LSTM VỚI BEST_PARAMS CỦA BẠN
            # Các giá trị này được lấy chính xác từ file test của bạn
            self.lstm_params = {
                'embed_dim': 128,
                'hidden_dim': 128,
                'n_layers': 1,
                'dropout': 0.2553762031763519
            }
            
            self.lstm_model = BehaviorLSTM(
                num_prods=self.num_prods,
                num_acts=self.num_acts,
                **self.lstm_params
            ).to(self.device)
            
            # Load trọng số (.pth)
            self.lstm_model.load_state_dict(
                torch.load(settings.MODEL_PATH, map_location=self.device)
            )
            self.lstm_model.eval() # Chế độ dự đoán
            logger.info(f"Đã load LSTM model thành công từ {settings.MODEL_PATH}")

            # C. KẾT NỐI NEO4J (Graph Database)
            self.graph_driver = GraphDatabase.driver(
                settings.NEO4J_URI, 
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
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

        except Exception as e:
            logger.error(f"Lỗi khởi tạo AI Engines: {str(e)}")
            raise e

    def get_recommendation(self, user_id: str):
        """
        1. LSTM: Dự đoán xác suất sản phẩm user sẽ tương tác/mua
        2. Neo4j: Lấy sản phẩm liên quan từ Knowledge Graph
        3. ChromaDB: Lấy sản phẩm gần nhất theo vector embedding
        4. Tính điểm hybrid: final_score = w1*lstm + w2*graph + w3*rag
        """
        import numpy as np
        seq_len = 10
        prod_seq = torch.randint(0, self.num_prods, (1, seq_len)).to(self.device)
        act_seq = torch.randint(0, self.num_acts, (1, seq_len)).to(self.device)
        x = torch.stack([prod_seq, act_seq], dim=2).squeeze(0)
        x = x.unsqueeze(0)  # (1, seq_len, 2)
        with torch.no_grad():
            logits = self.lstm_model(x)
            lstm_probs = torch.softmax(logits, dim=1).cpu().numpy().flatten()
        lstm_score = {i: lstm_probs[i] for i in range(self.num_prods)}

        # 2. Neo4j: Lấy sản phẩm liên quan (giả lập)
        graph_products = set()
        try:
            from app.settings import settings
            with self.graph_driver.session(database=settings.NEO4J_DATABASE) as session:
                cypher = """
                MATCH (u:User {id: $user_id})-[:PURCHASED|VIEWED]->(p:Product)
                RETURN p.product_id as pid
                LIMIT 10
                """
                result = session.run(cypher, user_id=user_id)
                graph_products = set([r["pid"] for r in result])
        except Exception as e:
            logger.warning(f"Neo4j query failed: {e}")

        # 3. ChromaDB: Vector search (giả lập query embedding)
        try:
            user_query = f"user_{user_id}"
            query_emb = self.embed_model.encode([user_query])
            results = self.collection.query(query_embeddings=query_emb, n_results=10)
            rag_products = set([int(pid) for pid in results["ids"][0]])
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {e}")
            rag_products = set()

        # 4. Hybrid score
        w1, w2, w3 = settings.W1_LSTM, settings.W2_GRAPH, settings.W3_RAG
        all_products = set(list(lstm_score.keys())) | graph_products | rag_products
        scored = []
        for pid in all_products:
            s1 = lstm_score.get(pid, 0)
            s2 = 1 if pid in graph_products else 0
            s3 = 1 if pid in rag_products else 0
            final = w1*s1 + w2*s2 + w3*s3
            scored.append((pid, final))
        scored.sort(key=lambda x: x[1], reverse=True)
        top_products = [int(pid) for pid, _ in scored[:3]]
        return top_products

    def chatbot_response(self, query: str):
        """
        1. Embed query
        2. Retrieve sản phẩm liên quan từ ChromaDB
        3. Sinh câu trả lời dựa trên kết quả (giả lập)
        """
        try:
            query_emb = self.embed_model.encode([query])
            results = self.collection.query(query_embeddings=query_emb, n_results=3)
            product_ids = results["ids"][0]
            # Giả lập lấy tên sản phẩm, thực tế cần truy vấn thêm DB
            product_names = [f"Laptop {pid}" for pid in product_ids]
            response = f"Bạn có thể tham khảo: {', '.join(product_names)}."
        except Exception as e:
            logger.warning(f"Chatbot RAG failed: {e}")
            response = "Xin lỗi, tôi chưa tìm được sản phẩm phù hợp."
        return response
    def close(self):
        """Đóng các kết nối khi dừng service"""
        if self.graph_driver:
            self.graph_driver.close()
            logger.info("Đã đóng driver Neo4j.")

# Khởi tạo Singleton để sử dụng trong toàn ứng dụng
ml_loader = ModelLoader()