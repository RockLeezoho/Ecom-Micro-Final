import urllib.request
import json

url = "http://localhost:8003/api/admin/products/0839798a-4c21-4c37-a3be-62daa7b4f4da/"

payload = json.dumps({
    "name": "Sách Toán",
    "price": "120000",
    "stock": 100,
    "category": "e1f13b19-21b8-4c12-a7d1-dc3a36eb3a77",
    "status": "NEW",
    "description": "Sách toán học cơ bản"
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, method='PATCH')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    body = e.read().decode('utf-8')
    print("Error Body Length:", len(body))
    print("Error Body:", body)
