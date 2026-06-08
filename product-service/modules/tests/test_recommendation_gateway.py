from unittest.mock import Mock, patch

from modules.infrastructure.gateways.grpc_product_gateways import GrpcRecommendationGateway


def test_get_recommended_product_ids_returns_ids_from_rest_endpoint():
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"recommended_product_ids": ["p1", "p2", "p3"]}

    with patch("modules.infrastructure.gateways.grpc_product_gateways.requests.get", return_value=response) as mock_get:
        gateway = GrpcRecommendationGateway(host="ai-service:50051")
        product_ids = gateway.get_recommended_product_ids("cat-1")

    mock_get.assert_called_once_with(
        "http://ai-service:8002/api/v1/recommend",
        params={"user_id": "cat-1", "category_key": "cat-1"},
        timeout=10,
    )
    assert product_ids == ["p1", "p2", "p3"]