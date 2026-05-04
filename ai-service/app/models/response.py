from pydantic import BaseModel
from typing import List

class RecommendResponse(BaseModel):
    user_id: str
    recommended_product_ids: List[str]

class ChatResponse(BaseModel):
    answer: str
    product_ids: List[str]