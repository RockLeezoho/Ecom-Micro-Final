import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./models/best_behavior_lstm.pth")
PROD_ENC_PATH = os.getenv("PROD_ENC_PATH", "./models/prod_encoder.pkl")
ACT_ENC_PATH = os.getenv("ACT_ENC_PATH", "./models/act_encoder.pkl")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "123456")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "aiservicedb")

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chromadb/")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "keepitreal/vietnamese-sbert")

W1_LSTM = float(os.getenv("W1_LSTM", 0.5))
W2_GRAPH = float(os.getenv("W2_GRAPH", 0.3))
W3_RAG = float(os.getenv("W3_RAG", 0.2))