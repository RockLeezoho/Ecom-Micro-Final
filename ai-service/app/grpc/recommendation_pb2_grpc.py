from __future__ import annotations

import grpc

from . import recommendation_pb2 as recommendation__pb2


class RecommendationServiceServicer:
    def GetRecommendedProducts(self, request, context):
        raise NotImplementedError("Method not implemented!")

    def GetRelatedProducts(self, request, context):
        raise NotImplementedError("Method not implemented!")


def add_RecommendationServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
        "GetRecommendedProducts": grpc.unary_unary_rpc_method_handler(
            servicer.GetRecommendedProducts,
            request_deserializer=recommendation__pb2.RecommendedProductsRequest.FromString,
            response_serializer=lambda message: message.SerializeToString(),
        ),
        "GetRelatedProducts": grpc.unary_unary_rpc_method_handler(
            servicer.GetRelatedProducts,
            request_deserializer=recommendation__pb2.RelatedProductsRequest.FromString,
            response_serializer=lambda message: message.SerializeToString(),
        ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
        "recommendation.RecommendationService",
        rpc_method_handlers,
    )
    server.add_generic_rpc_handlers((generic_handler,))


class RecommendationServiceStub:
    def __init__(self, channel):
        self.GetRecommendedProducts = channel.unary_unary(
            "/recommendation.RecommendationService/GetRecommendedProducts",
            request_serializer=lambda message: message.SerializeToString(),
            response_deserializer=recommendation__pb2.RecommendedProductsResponse.FromString,
        )
        self.GetRelatedProducts = channel.unary_unary(
            "/recommendation.RecommendationService/GetRelatedProducts",
            request_serializer=lambda message: message.SerializeToString(),
            response_deserializer=recommendation__pb2.RelatedProductsResponse.FromString,
        )