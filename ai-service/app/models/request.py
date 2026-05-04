from pydantic import BaseModel
from typing import List


class ChatRequest(BaseModel):
    query: str


class RecommendRequest(BaseModel):
    user_id: str
    history_prods: List[str] = []
    history_acts: List[str] = []
    user_query: str = ""


class FrontendChatRequest(BaseModel):
    user_query: str