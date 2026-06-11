import os
import sys
import pandas as pd
import kagglehub

sys.stdout.reconfigure(encoding='utf-8')

def download_and_sample():
    print("1. Đang tải bộ dữ liệu từ Kaggle (Vui lòng chờ, file khá nặng)...")
    # Lệnh này sẽ tải toàn bộ file về một thư mục cache ẩn của kagglehub
    dataset_path = kagglehub.dataset_download("mkechinov/ecommerce-behavior-data-from-multi-category-store")
    print("Đã tải xong tại:", dataset_path)
    
    # Kaggle dataset này thường có 2 file: 2019-Oct.csv và 2019-Nov.csv
    # Tớ sẽ lấy file tháng 10 làm ví dụ
    large_csv_file = os.path.join(dataset_path, "2019-Oct.csv")
    
    if not os.path.exists(large_csv_file):
        print(f"Lỗi: Không tìm thấy file {large_csv_file}")
        return

    output_file = os.path.join("artifacts", "sampled_data_50k.csv")
    os.makedirs("artifacts", exist_ok=True)
    
    print("2. Đang quét file để lấy danh sách 50,000 User ID đầu tiên...")
    target_users = set()
    limit_users = 50000
    
    # Đọc chunk 100,000 dòng mỗi lần (Chỉ tốn vài chục MB RAM)
    for chunk in pd.read_csv(large_csv_file, usecols=['user_id'], chunksize=100000):
        unique_users_in_chunk = set(chunk['user_id'].unique())
        target_users.update(unique_users_in_chunk)
        if len(target_users) >= limit_users:
            # Nếu đã gom đủ (hoặc dư) 50k user thì dừng
            target_users = set(list(target_users)[:limit_users])
            break
            
    print(f"Đã gom được {len(target_users)} Users. Đang trích xuất toàn bộ lịch sử của họ...")
    
    # 3. Quét lại file lần nữa, chỉ giữ lại các dòng của 50k users này và ghi ra file mới
    chunk_iterator = pd.read_csv(large_csv_file, chunksize=100000)
    is_first_chunk = True
    
    for chunk in chunk_iterator:
        # Lọc ra các dòng thuộc về 50,000 users đã chọn
        filtered_chunk = chunk[chunk['user_id'].isin(target_users)]
        
        if not filtered_chunk.empty:
            # mode='w' cho chunk đầu (để ghi header), mode='a' (append) cho các chunk sau
            filtered_chunk.to_csv(output_file, mode='w' if is_first_chunk else 'a', 
                                  header=is_first_chunk, index=False)
            is_first_chunk = False

    print(f"✅ HOÀN TẤT! Dữ liệu thu gọn cực nhẹ đã được lưu tại: {output_file}")
    print("💡 Cậu có thể xóa các file gốc nặng vài GB trong thư mục dataset của Kaggle đi cho nhẹ máy.")

if __name__ == "__main__":
    download_and_sample()
