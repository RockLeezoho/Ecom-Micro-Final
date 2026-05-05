from __future__ import annotations

import os

import grpc

from modules.application.ports.order_gateway import OrderGateway
from modules.application.ports.recommendation_gateway import RecommendationGateway
from modules.infrastructure.proto import order_service_pb2_grpc, recommendation_pb2, recommendation_pb2_grpc


class GrpcRecommendationGateway(RecommendationGateway):
    def __init__(self, host: str | None = None):
        self.host = host or os.getenv('RECOMMENDATION_GRPC_HOST', 'ai_service:50051')

    def get_recommended_product_ids(self, category_id: str) -> list[str]:
        try:
            with grpc.insecure_channel(self.host) as channel:
                stub = recommendation_pb2_grpc.RecommendationServiceStub(channel)
                response = stub.GetRecommendedProducts(recommendation_pb2.RecommendedProductsRequest(category_id=category_id))
                return list(response.product_ids)
        except Exception:
            return []

    def get_related_product_ids(self, product_id: str) -> list[str]:
        try:
            with grpc.insecure_channel(self.host) as channel:
                stub = recommendation_pb2_grpc.RecommendationServiceStub(channel)
                response = stub.GetRelatedProducts(recommendation_pb2.RelatedProductsRequest(product_id=product_id))
                return list(response.product_ids)
        except Exception:
            return []


class GrpcOrderGateway(OrderGateway):
    def __init__(self, host: str | None = None):
        self.host = host or os.getenv('ORDER_GRPC_HOST', 'order_service:50052')

    def get_best_seller_product_ids(self, category_id: str) -> list[str]:
        try:
            with grpc.insecure_channel(self.host) as channel:
                stub = order_service_pb2_grpc.OrderServiceStub(channel)
                response = stub.GetBestSellers(category_id=category_id)
                return list(response.product_ids)
        except Exception:
            return []
