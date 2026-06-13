import urllib.request
import urllib.parse
import json
import uuid

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgxMzMyMzE1LCJpYXQiOjE3ODEzMjg3MTUsImp0aSI6Ijk3MTRjNDc3MWQzNjRiMWNhOGEzYWIwMzE0MzI2YmVlIiwidXNlcl9pZCI6Ijg3ZjBiMGIyLWUwYzUtNDRhZS1iNGRmLTMxOTI1NDgyYTYzYiJ9.QmEpHaN3vA4e6DvHugvouwHEAQcQcnjYtUvO607aoq4"

# 2. Get categories to get a valid UUID
cat_url = "http://localhost:3000/api/categories/all/"
req = urllib.request.Request(cat_url)
try:
    with urllib.request.urlopen(req) as response:
        categories = json.loads(response.read().decode())
        cat_id = None
        for c in categories:
            if c['slug'] == 'sach-luu-tru':
                cat_id = c\['id'\]
                break
        if not cat_id and categories:
            cat_id = categories[0]['id']
        print(f"Using category ID: {cat_id}")
except urllib.error.HTTPError as e:
    print("Fetch categories failed:", e.read().decode())
    exit(1)

# 3. Get first product
products_url = "http://localhost:3000/api/products/list/?page_size=1"
req = urllib.request.Request(products_url)
try:
    with urllib.request.urlopen(req) as response:
        products_res = json.loads(response.read().decode())
        product_id = products_res['results'][0]['id']
        print(f"Target product ID: {product_id}")
except urllib.error.HTTPError as e:
    print("Fetch products failed:", e.read().decode())
    exit(1)

# 4. Patch product (simulating JSON payload from updateAdminProduct)
patch_url = f"http://localhost:3000/api/products/admin/products/{product_id}/"
patch_payload = {
    "name": "Updated Name By Script",
    "origin": None,
    "price": 9999,
    "stock": 50,
    "category": cat_id,
    "status": "NEW",
    "description": "Updated desc"
}

patch_req = urllib.request.Request(patch_url, data=json.dumps(patch_payload).encode('utf-8'), method='PATCH', headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})

try:
    with urllib.request.urlopen(patch_req) as response:
        print("PATCH successful!")
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"PATCH failed with status {e.code}:")
    print(e.read().decode())
