from fastapi import APIRouter
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse
from app.engines.model_loader import chatbot_response

router = APIRouter()

@router.post("/", response_model=ChatbotResponse)
def chatbot(req: ChatbotRequest):
    """Chatbot: semantic search and answer generation."""
    answer = chatbot_response(req.query)
    return ChatbotResponse(response=answer)
