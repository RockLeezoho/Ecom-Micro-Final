import requests
import json
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

API_GATEWAY_URL = "http://localhost:8080"

def test_chatbot():
    print("Testing /api/ai/chatbot...")
    try:
        res = requests.post(
            f"{API_GATEWAY_URL}/api/ai/chatbot",
            json={"query": "Tôi muốn mua điện thoại giá rẻ"}
        )
        print(f"Status Code: {res.status_code}")
        print("Response:", json.dumps(res.json(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error testing /api/ai/chatbot: {e}")

def test_chatbot_context():
    print("\nTesting /api/ai/chat with context...")
    try:
        # Step 1: Initial question
        res1 = requests.post(
            f"{API_GATEWAY_URL}/api/ai/chat",
            json={"user_query": "laptop"}
        )
        data1 = res1.json()
        print("Query 1:", "laptop")
        print("Response 1:", data1["answer"])
        print("Products 1:", data1.get("product_ids", []))
        
        prod_ids = data1.get("product_ids", [])
        
        # Step 2: Follow-up question with context
        res2 = requests.post(
            f"{API_GATEWAY_URL}/api/ai/chat",
            json={"user_query": "cho tớ xem hãng, màu và giá máy đi", "context_product_ids": ["1eaeb2a3-09a2-4d9c-a2c3-6fc0ba2b2f3e"]}
        )
        data2 = res2.json()
        print("\nQuery 2:", "cho tớ xem cấu hình máy đi", "with context:", prod_ids)
        print("Response 2:", data2["answer"])
        print("Products 2:", data2.get("product_ids", []))
    except Exception as e:
        print(f"Error testing context: {e}")

if __name__ == "__main__":
    test_chatbot_context()
