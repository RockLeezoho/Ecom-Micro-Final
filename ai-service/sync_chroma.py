import os
import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer
import logging

logging.basicConfig(level=logging.INFO)

PRODUCTS_CSV = "/app/train-ai/artifacts/products.csv"
CHROMA_PATH = "./chromadb/"

def main():
    if not os.path.exists(PRODUCTS_CSV):
        print(f"Không tìm thấy {PRODUCTS_CSV}")
        return
        
    df = pd.read_csv(PRODUCTS_CSV, encoding='utf-8-sig')
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    try:
        client.delete_collection("products")
        print("Đã xóa collection 'products' cũ.")
    except Exception:
        pass
        
    collection = client.create_collection("products")
    
    print("Loading SentenceTransformer...")
    model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    
    docs = []
    metadatas = []
    ids = []
    
    for idx, row in df.iterrows():
        pid = str(row.get('id', ''))
        if not pid or pid == 'nan':
            continue
        name = str(row.get('name', ''))
        category = str(row.get('category', ''))
        
        text = f"{name} - Danh mục: {category}"
        docs.append(text)
        metadatas.append({"name": name, "category": category})
        ids.append(pid)
        
    print(f"Bắt đầu nhúng {len(docs)} sản phẩm vào ChromaDB...")
    
    batch_size = 50
    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        
        embeddings = model.encode(batch_docs).tolist()
        
        collection.add(
            embeddings=embeddings,
            documents=batch_docs,
            metadatas=batch_metas,
            ids=batch_ids
        )
        print(f" Đã xử lý {min(i+batch_size, len(docs))}/{len(docs)}...")
        
    print(f"Hoàn tất! Tổng số record trong ChromaDB: {collection.count()}")

if __name__ == "__main__":
    main()
