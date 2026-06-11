import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import os
import sys
import joblib
from sklearn.preprocessing import LabelEncoder
from tqdm import tqdm

sys.stdout.reconfigure(encoding='utf-8')

# Tự động xác định thư mục gốc của dự án (ecom-final-micro)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_ARTIFACTS_DIR = os.path.join(BASE_DIR, "train-ai", "artifacts")
TRAIN_MODELS_DIR = os.path.join(BASE_DIR, "train-ai", "models")

# Đảm bảo thư mục models tồn tại
os.makedirs(TRAIN_MODELS_DIR, exist_ok=True)

# ==========================================
# 1. PHÂN TÍCH THIẾT BỊ
# ==========================================
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🚀 Huấn luyện trên thiết bị: {device}")

# ==========================================
# 2. ĐỌC VÀ CHUẨN BỊ DỮ LIỆU
# ==========================================
path_products = os.path.join(TRAIN_ARTIFACTS_DIR, "real_products.csv")
path_behavior = os.path.join(TRAIN_ARTIFACTS_DIR, "real_behavior.csv")

if not os.path.exists(path_products) or not os.path.exists(path_behavior):
    raise FileNotFoundError("❌ Không tìm thấy các file dữ liệu cần thiết! Vui lòng chạy prepare_real_data.py trước")

products_df = pd.read_csv(path_products)
behavior_df = pd.read_csv(path_behavior)

print(f"📊 Số lượng sản phẩm: {len(products_df)}")
print(f"📊 Số lượng bản ghi tương tác: {len(behavior_df)}")

# Khởi tạo Encoders và đặt "<PAD>" tại index 0
prod_classes = ["<PAD>"] + sorted(products_df["id"].unique().tolist())
prod_encoder = LabelEncoder()
prod_encoder.classes_ = np.array(prod_classes)

act_classes = ["<PAD>"] + sorted(behavior_df["action"].unique().tolist())
act_encoder = LabelEncoder()
act_encoder.classes_ = np.array(act_classes)

num_prods = len(prod_encoder.classes_)
num_acts = len(act_encoder.classes_)
print(f"🔑 Tổng số Product Classes (kèm PAD): {num_prods}")
print(f"🔑 Tổng số Action Classes (kèm PAD): {num_acts}")

# Lưu các encoders thành file .pkl
joblib.dump(prod_encoder, os.path.join(TRAIN_MODELS_DIR, "prod_encoder.pkl"))
joblib.dump(act_encoder, os.path.join(TRAIN_MODELS_DIR, "act_encoder.pkl"))
print("💾 Đã lưu prod_encoder.pkl và act_encoder.pkl thành công!")

# ==========================================
# 3. TẠO DATASET SLIDING WINDOW (WINDOW_SIZE = 15)
# ==========================================
WINDOW_SIZE = 15
sequences = []
targets = []

print("Đang mã hóa toàn bộ dữ liệu...")
behavior_df = behavior_df.sort_values("timestamp")
behavior_df["prod_seq"] = prod_encoder.transform(behavior_df["product_id"])
behavior_df["act_seq"] = act_encoder.transform(behavior_df["action"])

print("Đang tạo Sliding Windows...")
grouped = behavior_df.groupby("user_id")

for user_id, group in grouped:
    prod_seq_mapped = group["prod_seq"].values
    act_seq_mapped = group["act_seq"].values
    n = len(prod_seq_mapped)
    
    if n <= WINDOW_SIZE:
        continue
        
    for i in range(n - WINDOW_SIZE):
        x_p = prod_seq_mapped[i : i + WINDOW_SIZE]
        x_a = act_seq_mapped[i : i + WINDOW_SIZE]
        x_combined = np.stack((x_p, x_a), axis=1) # (15, 2)
        
        y = prod_seq_mapped[i + WINDOW_SIZE]
        
        sequences.append(x_combined)
        targets.append(y)

X = np.array(sequences)
y = np.array(targets)

print(f"📦 Tổng số mẫu sliding windows tạo ra: {len(X)}")

class BehaviorDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.LongTensor(X)
        self.y = torch.LongTensor(y)
        
    def __len__(self):
        return len(self.X)
        
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# Split Train / Validation (80/20)
split_idx = int(len(X) * 0.8)
train_dataset = BehaviorDataset(X[:split_idx], y[:split_idx])
val_dataset = BehaviorDataset(X[split_idx:], y[split_idx:])

train_loader = DataLoader(train_dataset, batch_size=1024, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=1024, shuffle=False)

# ==========================================
# 4. ĐỊNH NGHĨA KIẾN TRÚC MÔ HÌNH BEHAVIORLSTM
# ==========================================
class BehaviorLSTM(nn.Module):
    def __init__(self, num_prods, num_acts, embed_dim=128, hidden_dim=128, n_layers=1, dropout=0.25):
        super().__init__()
        self.prod_embed = nn.Embedding(num_prods, embed_dim)
        self.act_embed = nn.Embedding(num_acts, embed_dim)
        
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
        return self.fc(lstm_out[:, -1, :])

# Khởi tạo mô hình
model = BehaviorLSTM(
    num_prods=num_prods,
    num_acts=num_acts
).to(device)

model_path = os.path.join(TRAIN_MODELS_DIR, "best_behavior_lstm.pth")
if os.path.exists(model_path):
    print(f"🔄 Đã tìm thấy file trọng số cũ tại {model_path}.")
    print("Đang nạp trọng số để tiếp tục huấn luyện (Resume Training)...")
    model.load_state_dict(torch.load(model_path, map_location=device))


criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.005, weight_decay=1e-5)

# ==========================================
# 5. HUẤN LUYỆN MÔ HÌNH (TRAINING LOOP)
# ==========================================
num_epochs = 15
best_val_loss = float('inf')

print("\n🏋️ Bắt đầu huấn luyện...")
for epoch in range(1, num_epochs + 1):
    model.train()
    train_loss = 0.0
    
    pbar = tqdm(train_loader, desc=f"Epoch {epoch:02d}/{num_epochs:02d} [Train]")
    for batch_x, batch_y in pbar:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)
        
        optimizer.zero_grad()
        outputs = model(batch_x)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()
        
        train_loss += loss.item() * batch_x.size(0)
        pbar.set_postfix({'loss': f"{loss.item():.4f}"})
        
    train_loss /= len(train_loader.dataset)
    
    # Đánh giá trên tập Validation
    model.eval()
    val_loss = 0.0
    top1_correct = 0
    top3_correct = 0
    top5_correct = 0
    recall5_sum = 0.0
    mrr_sum = 0.0
    total = 0
    with torch.no_grad():
        val_pbar = tqdm(val_loader, desc=f"Epoch {epoch:02d}/{num_epochs:02d} [Val]")
        for batch_x, batch_y in val_pbar:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            val_loss += loss.item() * batch_x.size(0)
            
            # Top-k metrics
            _, top5_pred = torch.topk(outputs, k=5, dim=1)
            top1_pred = top5_pred[:, :1]
            top3_pred = top5_pred[:, :3]

            for target, preds5, preds3, preds1 in zip(batch_y, top5_pred, top3_pred, top1_pred):
                target_id = target.item()
                total += 1

                if target_id in preds1:
                    top1_correct += 1
                if target_id in preds3:
                    top3_correct += 1
                if target_id in preds5:
                    top5_correct += 1
                    recall5_sum += 1.0

                    # Reciprocal rank within top-5
                    for rank, pred_id in enumerate(preds5.tolist(), start=1):
                        if pred_id == target_id:
                            mrr_sum += 1.0 / rank
                            break
                
    val_loss /= len(val_loader.dataset)
    top1_acc = top1_correct / total if total > 0 else 0
    top3_acc = top3_correct / total if total > 0 else 0
    top5_acc = top5_correct / total if total > 0 else 0
    recall_at_5 = recall5_sum / total if total > 0 else 0
    mrr = mrr_sum / total if total > 0 else 0
    
    print(
        f"Epoch {epoch:02d}/{num_epochs:02d} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} "
        f"| Top-1: {top1_acc*100:.2f}% | Top-3: {top3_acc*100:.2f}% | Top-5: {top5_acc*100:.2f}% "
        f"| Recall@5: {recall_at_5*100:.2f}% | MRR: {mrr:.4f}"
    )
    
    # Lưu mô hình tốt nhất
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), os.path.join(TRAIN_MODELS_DIR, "best_behavior_lstm.pth"))

print(f"\n🎉 Huấn luyện hoàn tất! Trọng số tốt nhất đã được lưu tại: {os.path.join(TRAIN_MODELS_DIR, 'best_behavior_lstm.pth')}")
