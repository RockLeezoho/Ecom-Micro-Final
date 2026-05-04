import grpc
import os
# Import generated gRPC stubs (ensure these files are generated from your .proto files)
from modules.infrastructure.proto import recommendation_pb2, recommendation_pb2_grpc, order_service_pb2_grpc

RECOMMENDATION_HOST = os.getenv("RECOMMENDATION_GRPC_HOST", "ai_service:50051")
ORDER_HOST = os.getenv("ORDER_GRPC_HOST", "order_service:50052")


def get_recommendation_stub():
    channel = grpc.insecure_channel(RECOMMENDATION_HOST)
    return recommendation_pb2_grpc.RecommendationServiceStub(channel)

# Helper for product detail recommendations
def get_related_products_via_grpc(product_id):
    stub = get_recommendation_stub()
    try:
        resp = stub.GetRelatedProducts(recommendation_pb2.RelatedProductsRequest(product_id=str(product_id)))
        return list(resp.product_ids)
    except Exception:
        return []

def get_order_stub():
    channel = grpc.insecure_channel(ORDER_HOST)
    return order_service_pb2_grpc.OrderServiceStub(channel)
