import asyncio
from app.services.ai_service import AIService

async def test_ai_service():
    ai = AIService()
    user_id = "u001"
    history_prods = ["P0401", "P0305", "P0701"]
    history_acts = ["view", "add_to_cart", "purchase"]
    user_query = "Tôi muốn tìm laptop dưới 20 triệu"

    # Test recommendation
    recs = await ai.get_hybrid_recommendations(user_id, history_prods, history_acts, user_query)
    print("Danh sách gợi ý sản phẩm:", recs)

    # Test chatbot tư vấn
    answer, prod_id = await ai.chatbot_response(user_query)
    print("Chatbot trả lời:", answer)
    print("Sản phẩm liên quan nhất:", prod_id)

if __name__ == "__main__":
    asyncio.run(test_ai_service())
