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

def test_frontend_chat():
    print("\nTesting /api/ai/chat...")
    try:
        res = requests.post(
            f"{API_GATEWAY_URL}/api/ai/chat",
            json={"user_query": "Tìm cho tôi áo thun nam"}
        )
        print(f"Status Code: {res.status_code}")
        print("Response:", json.dumps(res.json(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error testing /api/ai/chat: {e}")

if __name__ == "__main__":
    test_chatbot()
    test_frontend_chat()
