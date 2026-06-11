import os
import sys
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

def prepare_data():
    print("🚀 Bắt đầu tiền xử lý dữ liệu thực tế (sampled_data_50k.csv)...")
    input_file = os.path.join(ARTIFACTS_DIR, "sampled_data_50k.csv")
    
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Không tìm thấy file {input_file}")
        
    df = pd.read_csv(input_file)
    
    # 1. TẠO TẬP SẢN PHẨM (real_products.csv)
    print("📦 Đang trích xuất dữ liệu sản phẩm...")
    products = df[['product_id', 'category_code', 'brand', 'price']].drop_duplicates(subset=['product_id'])
    products = products.rename(columns={'product_id': 'id'})
    # Fill NaN for category and brand
    products['category_code'] = products['category_code'].fillna('unknown')
    products['brand'] = products['brand'].fillna('unknown')
    products.to_csv(os.path.join(ARTIFACTS_DIR, "real_products.csv"), index=False)
    
    # 2. TẠO TẬP HÀNH VI CHO LSTM (real_behavior.csv)
    print("👤 Đang tạo lịch sử hành vi cho LSTM...")
    behavior = df[['user_id', 'product_id', 'event_type', 'event_time']].copy()
    behavior = behavior.rename(columns={'event_type': 'action', 'event_time': 'timestamp'})
    behavior.to_csv(os.path.join(ARTIFACTS_DIR, "real_behavior.csv"), index=False)
    
    # 3. TẠO TẬP DỮ LIỆU RANKING CHO XGBOOST (real_train_xgboost.csv)
    print("📈 Đang xây dựng tập dữ liệu cho XGBoost...")
    # Lấy thông tin giá trị của sản phẩm
    prod_info = products.set_index('id')
    
    # Tính số lượt view thực tế của từng sản phẩm
    view_counts = behavior[behavior['action'] == 'view'].groupby('product_id').size().to_dict()
    
    # Xác định label: cart/purchase -> 1, view -> 0
    # Gom nhóm theo user_id, product_id để xem mức độ tương tác cao nhất
    # Mapping action to score: view=0, cart=1, purchase=1
    def action_to_label(action):
        return 1 if action in ['cart', 'purchase'] else 0
        
    behavior['label'] = behavior['action'].apply(action_to_label)
    
    # Lấy label cao nhất cho mỗi cặp (user, product)
    xgb_df = behavior.groupby(['user_id', 'product_id'])['label'].max().reset_index()
    
    # Ghép các features vào
    xgb_df['price'] = xgb_df['product_id'].map(prod_info['price']).fillna(0)
    xgb_df['viewCount'] = xgb_df['product_id'].map(view_counts).fillna(0)
    
    # Mock các thông số ảo để tương thích hệ thống hiện tại
    np.random.seed(42)
    n_samples = len(xgb_df)
    xgb_df['stock'] = np.random.randint(0, 100, n_samples)
    xgb_df['rating'] = np.random.uniform(3.5, 5.0, n_samples)
    
    # Tương tác có Label 1 thì điểm AI cao hơn chút, Label 0 thì random đều
    xgb_df['lstm_score'] = np.where(xgb_df['label'] == 1, np.random.uniform(0.7, 1.0, n_samples), np.random.uniform(0.0, 0.6, n_samples))
    xgb_df['graph_score'] = np.where(xgb_df['label'] == 1, np.random.uniform(0.6, 1.0, n_samples), np.random.uniform(0.0, 0.7, n_samples))
    xgb_df['rag_score'] = np.where(xgb_df['label'] == 1, np.random.uniform(0.5, 1.0, n_samples), np.random.uniform(0.0, 0.8, n_samples))
    
    # Lưu file
    cols = ['lstm_score', 'graph_score', 'rag_score', 'price', 'stock', 'rating', 'viewCount', 'label']
    final_xgb_df = xgb_df[cols]
    out_path = os.path.join(ARTIFACTS_DIR, "real_train_xgboost.csv")
    final_xgb_df.to_csv(out_path, index=False)
    
    print(f"✅ HOÀN TẤT! Đã sinh {len(final_xgb_df)} mẫu huấn luyện XGBoost.")
    print("Label distribution:")
    print(final_xgb_df['label'].value_counts())

if __name__ == "__main__":
    prepare_data()
