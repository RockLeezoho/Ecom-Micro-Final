from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import os
from typing import Optional

import grpc

from app.grpc import recommendation_pb2
from app.grpc import recommendation_pb2_grpc
from app.services.ai_service import AIService


_grpc_server: Optional[grpc.Server] = None


class RecommendationGrpcServicer(recommendation_pb2_grpc.RecommendationServiceServicer):
    def __init__(self, ai_service: AIService | None = None):
        self.ai_service = ai_service or AIService()

    def GetRecommendedProducts(self, request, context):
        category_key = str(getattr(request, "category_id", "") or "").strip()
        product_ids = self.ai_service.get_category_recommendations(category_key, limit=10)
        return recommendation_pb2.RecommendedProductsResponse(product_ids=product_ids)

    def GetRelatedProducts(self, request, context):
        product_id = str(getattr(request, "product_id", "") or "").strip()
        product_ids = self.ai_service.get_related_products(product_id, limit=10)
        return recommendation_pb2.RelatedProductsResponse(product_ids=product_ids)


def start_grpc_server() -> Optional[grpc.Server]:
    global _grpc_server
    if _grpc_server is not None:
        return _grpc_server

    grpc_port = os.getenv("AI_GRPC_PORT", "50051")
    max_workers = int(os.getenv("AI_GRPC_MAX_WORKERS", "8"))

    server = grpc.server(ThreadPoolExecutor(max_workers=max_workers))
    recommendation_pb2_grpc.add_RecommendationServiceServicer_to_server(
        RecommendationGrpcServicer(),
        server,
    )

    bound_port = server.add_insecure_port(f"[::]:{grpc_port}")
    if bound_port == 0:
        return None

    server.start()
    _grpc_server = server
    return server


def stop_grpc_server() -> None:
    global _grpc_server
    if _grpc_server is None:
        return
    _grpc_server.stop(grace=3)
    _grpc_server = None