from unittest.mock import Mock, patch

from modules.infrastructure.gateways.grpc_product_gateways import GrpcOrderGateway


def test_get_best_seller_product_ids_returns_ids_from_http_endpoint():
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"product_ids": ["p1", "p2", "p3"]}

    with patch("modules.infrastructure.gateways.grpc_product_gateways.requests.get", return_value=response) as mock_get:
        gateway = GrpcOrderGateway(host="http://order-service:8005/api")
        product_ids = gateway.get_best_seller_product_ids("category-1")

    mock_get.assert_called_once_with(
        "http://order-service:8005/api/orders/best-sellers/",
        params={"category_id": "category-1"},
        timeout=10,
    )
    assert product_ids == ["p1", "p2", "p3"]