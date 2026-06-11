import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_ARTIFACTS_DIR = os.path.join(BASE_DIR, "train-ai", "artifacts")
MODELS_DIR = os.path.join(BASE_DIR, "ai-service", "models")

os.makedirs(MODELS_DIR, exist_ok=True)

def train_xgboost():
    print("Bắt đầu huấn luyện mô hình XGBoost Ranking...")
    data_path = os.path.join(AI_ARTIFACTS_DIR, "real_train_xgboost.csv")
    
    if not os.path.exists(data_path):
        print(f"Không tìm thấy file dữ liệu: {data_path}")
        return
        
    df = pd.read_csv(data_path)
    
    features = ['lstm_score', 'graph_score', 'rag_score', 'price', 'stock', 'rating', 'viewCount']
    target = 'label'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Số lượng mẫu huấn luyện: {len(X_train)}")
    print(f"Số lượng mẫu kiểm thử: {len(X_test)}")
    
    # Tính scale_pos_weight
    neg_cases = (y_train == 0).sum()
    pos_cases = (y_train == 1).sum()
    scale_weight = neg_cases / pos_cases if pos_cases > 0 else 1.0
    print(f"Sử dụng scale_pos_weight = {scale_weight:.2f} do mất cân bằng dữ liệu")
    
    # Khởi tạo mô hình
    model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='auc',
        scale_pos_weight=scale_weight
    )
    
    # Huấn luyện
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=10
    )
    
    # Đánh giá
    preds_proba = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
    
    auc = roc_auc_score(y_test, preds_proba)
    acc = accuracy_score(y_test, preds)
    
    print("\n--- KẾT QUẢ ĐÁNH GIÁ ---")
    print(f"AUC Score: {auc:.4f}")
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, preds))
    
    # Lưu mô hình
    model_path = os.path.join(MODELS_DIR, "xgboost_ranker.json")
    model.save_model(model_path)
    print(f"✅ Đã lưu mô hình XGBoost tại: {model_path}")
    
    # Print feature importance
    importance = model.feature_importances_
    feat_imp = pd.DataFrame({'Feature': features, 'Importance': importance})
    feat_imp = feat_imp.sort_values(by='Importance', ascending=False)
    print("\nĐộ quan trọng của các đặc trưng:")
    print(feat_imp)

if __name__ == "__main__":
    train_xgboost()
