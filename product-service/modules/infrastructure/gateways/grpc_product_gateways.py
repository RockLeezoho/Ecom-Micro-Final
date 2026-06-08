from __future__ import annotations

import os

import grpc
import requests

from modules.application.ports.order_gateway import OrderGateway
from modules.application.ports.recommendation_gateway import RecommendationGateway
from modules.infrastructure.proto import recommendation_pb2, recommendation_pb2_grpc


class GrpcRecommendationGateway(RecommendationGateway):
    def __init__(self, host: str | None = None):
        self.host = host or os.getenv('RECOMMENDATION_GRPC_HOST', 'ai-service:50051')
        self.rest_base_url = os.getenv('RECOMMENDATION_REST_URL', 'http://ai-service:8002/api/v1')

    def get_recommended_product_ids(self, category_id: str) -> list[str]:
        try:
            response = requests.get(
                f"{self.rest_base_url}/recommend",
                params={"user_id": category_id, "category_key": category_id},
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                if "recommended_product_ids" in payload:
                    return [str(item) for item in payload.get("recommended_product_ids", [])]
                if "products" in payload:
                    return [str(item) for item in payload.get("products", [])]
            if isinstance(payload, list):
                return [str(item) for item in payload]
            return []
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
        self.base_url = host or os.getenv('ORDER_SERVICE_URL', 'http://order-service:8005/api')

    def get_best_seller_product_ids(self, category_id: str) -> list[str]:
        try:
            response = requests.get(
                f"{self.base_url}/orders/best-sellers/",
                params={"category_id": category_id},
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return list(payload.get("product_ids", []))
            if isinstance(payload, list):
                return [str(item) for item in payload]
            return []
        except Exception:
            return []
