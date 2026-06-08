from __future__ import annotations

import os
import unittest

os.environ.setdefault("AI_SERVICE_SKIP_MODEL_LOAD", "1")

from app.grpc import recommendation_pb2
from app.grpc.server import RecommendationGrpcServicer


class RecommendationGrpcServicerTest(unittest.TestCase):
    def test_get_recommended_products_returns_list(self):
        servicer = RecommendationGrpcServicer()
        servicer.ai_service.get_category_recommendations = lambda category_key, limit=10: ["p1", "p2", "p3"][:limit]

        request = recommendation_pb2.RecommendedProductsRequest(category_id="cat-1")
        response = servicer.GetRecommendedProducts(request, None)

        self.assertEqual(list(response.product_ids), ["p1", "p2", "p3"])

    def test_get_related_products_returns_list(self):
        servicer = RecommendationGrpcServicer()
        servicer.ai_service.get_related_products = lambda product_id, limit=10: ["r1", "r2"][:limit]

        request = recommendation_pb2.RelatedProductsRequest(product_id="prod-1")
        response = servicer.GetRelatedProducts(request, None)

        self.assertEqual(list(response.product_ids), ["r1", "r2"])