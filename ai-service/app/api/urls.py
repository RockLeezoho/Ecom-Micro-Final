from fastapi import APIRouter, Query

from app.models.request import ChatRequest, FrontendChatRequest, RecommendRequest
from app.models.response import RecommendResponse, ChatResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.get("/recommend", response_model=RecommendResponse)
async def get_recommend(user_id: str = Query(...)):
    try:
        product_ids = await ai_service.get_hybrid_recommendations(user_id, [], [], "")
    except Exception:
        product_ids = []
    return {"user_id": user_id, "recommended_product_ids": product_ids}


@router.post("/recommend")
async def post_recommend(request: RecommendRequest):
    try:
        product_ids = await ai_service.get_hybrid_recommendations(
            request.user_id,
            request.history_prods,
            request.history_acts,
            request.user_query,
        )
    except Exception:
        product_ids = []
    # Frontend currently reads res.products first.
    return {"user_id": request.user_id, "products": product_ids}


@router.post("/chatbot", response_model=ChatResponse)
async def post_chatbot(request: ChatRequest):
    try:
        answer, related_ids = await ai_service.chatbot_response(request.query)
    except Exception:
        answer, related_ids = "Xin loi, he thong AI dang bao tri.", []
    return {"answer": answer, "product_ids": related_ids}


@router.post("/chat")
async def post_chat(request: FrontendChatRequest):
    try:
        answer, related_ids = await ai_service.chatbot_response(request.user_query)
    except Exception:
        answer, related_ids = "Xin loi, he thong AI dang bao tri.", []
    return {"answer": answer, "product_ids": related_ids}