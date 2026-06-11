import pandas as pd
import numpy as np
import random
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_ARTIFACTS_DIR = os.path.join(BASE_DIR, "train-ai", "artifacts")

def generate_xgboost_data():
    print("Đang tạo dữ liệu huấn luyện XGBoost...")
    
    # 1. Load data
    products_df = pd.read_csv(os.path.join(AI_ARTIFACTS_DIR, "products.csv"))
    behavior_df = pd.read_csv(os.path.join(AI_ARTIFACTS_DIR, "data_user500.csv"))
    
    all_users = behavior_df['user_id'].unique()
    all_products = products_df['id'].tolist()
    
    # Create product metadata lookup
    product_meta = products_df.set_index('id')[['price', 'stock', 'rating', 'viewCount']].to_dict('index')
    
    dataset = []
    
    # 2. Extract Positive Samples
    strong_actions = ['add_to_cart', 'purchase', 'wishlist_add']
    
    for user_id in all_users:
        user_actions = behavior_df[behavior_df['user_id'] == user_id]
        interacted_products = user_actions['product_id'].unique()
        
        # Positive samples (interacted)
        for pid in interacted_products:
            is_strong = int(user_actions[user_actions['product_id'] == pid]['action'].isin(strong_actions).any())
            label = 1 if is_strong else random.choice([0, 1])
            
            lstm_s = round(random.uniform(0.6, 0.99), 3)
            graph_s = round(random.uniform(0.4, 0.9), 3)
            rag_s = round(random.uniform(0.5, 0.95), 3)
            
            meta = product_meta.get(pid, {'price': 0, 'stock': 0, 'rating': 0, 'viewCount': 0})
            
            dataset.append({
                'user_id': user_id,
                'product_id': pid,
                'lstm_score': lstm_s,
                'graph_score': graph_s,
                'rag_score': rag_s,
                'price': meta['price'],
                'stock': meta['stock'],
                'rating': meta['rating'],
                'viewCount': meta['viewCount'],
                'label': label
            })
            
        # 3. Generate Negative Samples
        negative_candidates = list(set(all_products) - set(interacted_products))
        num_negatives = len(interacted_products) * 2
        
        sampled_negatives = random.sample(negative_candidates, min(num_negatives, len(negative_candidates)))
        
        for pid in sampled_negatives:
            lstm_s = round(random.uniform(0.01, 0.4), 3)
            graph_s = round(random.uniform(0.0, 0.3), 3)
            rag_s = round(random.uniform(0.1, 0.5), 3)
            
            meta = product_meta.get(pid, {'price': 0, 'stock': 0, 'rating': 0, 'viewCount': 0})
            
            dataset.append({
                'user_id': user_id,
                'product_id': pid,
                'lstm_score': lstm_s,
                'graph_score': graph_s,
                'rag_score': rag_s,
                'price': meta['price'],
                'stock': meta['stock'],
                'rating': meta['rating'],
                'viewCount': meta['viewCount'],
                'label': 0
            })
            
    df_xgboost = pd.DataFrame(dataset)
    
    out_path = os.path.join(AI_ARTIFACTS_DIR, "train_xgboost.csv")
    df_xgboost.to_csv(out_path, index=False)
    print(f"✅ Đã tạo xong tập dữ liệu Ranking XGBoost với {len(df_xgboost)} mẫu tại: {out_path}")
    print(df_xgboost['label'].value_counts())

if __name__ == "__main__":
    generate_xgboost_data()
