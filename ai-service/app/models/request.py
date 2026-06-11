from pydantic import BaseModel
from pydantic import Field
from typing import List, Optional


class ChatRequest(BaseModel):
    query: str


class RecommendRequest(BaseModel):
    user_id: str
    category_key: Optional[str] = None
    history_prods: List[str] = Field(default_factory=list)
    history_acts: List[str] = Field(default_factory=list)
    user_query: str = ""


class FrontendChatRequest(BaseModel):
    user_query: str
    context_product_ids: Optional[List[str]] = None