# Embedding utilities for product descriptions

from sentence_transformers import SentenceTransformer
import numpy as np

# Load model chỉ 1 lần khi import module
_MODEL = SentenceTransformer('all-MiniLM-L6-v2')

def embed_text(text: str):
    """
    Sinh embedding vector cho text sử dụng sentence-transformers.
    """
    vec = _MODEL.encode(text)
    return vec.tolist() if isinstance(vec, np.ndarray) else list(vec)
