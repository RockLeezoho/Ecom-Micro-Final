from pydantic import BaseModel
from typing import List

class RecommendResponse(BaseModel):
    product_ids: List[int]