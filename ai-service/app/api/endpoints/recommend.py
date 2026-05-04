
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
import csv
import os

router = APIRouter()

PRODUCTS_CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "artifacts", "products.csv")

def get_img_url(product_id):
    # For demo, generate a fake image URL
    return f"https://api.becshop.vn/media/products/{product_id.lower()}.jpg"

@router.get("/", response_class=JSONResponse)
def recommend_by_category(category: str = Query(..., description="Category name")):
    """
    Get product suggestions by category
    """
    recommended = []
    with open(PRODUCTS_CSV, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["category"].lower() == category.lower():
                recommended.append({
                    "id": row["product_id"],
                    "name": row["name"],
                    "origin": row["origin"],
                    "price": float(row["price"]),
                    "rating": float(row["rating"]),
                    "stock": int(row["stock"]),
                    "imgUrl": get_img_url(row["product_id"]),
                    "status": ""
                })
    return {"recommended": recommended}
