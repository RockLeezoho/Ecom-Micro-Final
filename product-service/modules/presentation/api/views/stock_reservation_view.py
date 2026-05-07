# modules/presentation/api/views/stock_reservation_view.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404

from modules.presentation.api.serializers.stock_reservation_serializer import (
    CreateStockReservationSerializer,
    ReleaseStockReservationSerializer,
    ListReservationsFilterSerializer,
    StockReservationReadSerializer,
)
from modules.application.commands.create_stock_reservation_command import (
    CreateStockReservationCommand,
    CreateStockReservationInput,
)
from modules.application.commands.release_stock_reservation_command import (
    ReleaseStockReservationCommand,
    ReleaseStockReservationInput,
)
from modules.application.queries.list_reservations_query import ListReservationsQuery
from modules.infrastructure.repositories.stock_reservation_repository_impl import (
    StockReservationRepositoryImpl,
)
from modules.infrastructure.repositories.product_repository_impl import ProductRepositoryImpl
from modules.infrastructure.models.sock_reservation_model import StockReservationModel
from modules.domain.entities.stock_reservation import ReservationStatus
from modules.presentation.api.authentication import InternalServiceAuthentication, JWTBearerAuthentication


class StockReservationCreateAPIView(APIView):
    """
    POST /api/v1/products/reservations/
    
    Tạo stock reservation (giữ kho cho đơn hàng)
    
    Request:
    {
        "product_id": "uuid",
        "order_id": "uuid",
        "quantity": 5,
        "reservation_duration_minutes": 15  # optional
    }
    
    Response:
    {
        "reservation_id": "uuid",
        "product_id": "uuid",
        "order_id": "uuid",
        "quantity": 5,
        "expires_at": "datetime",
        "status": "ACTIVE"
    }
    """
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateStockReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Khởi tạo repositories
            stock_reservation_repo = StockReservationRepositoryImpl()
            product_repo = ProductRepositoryImpl()

            # Khởi tạo command
            command = CreateStockReservationCommand(stock_reservation_repo, product_repo)

            # Tạo input
            input_dto = CreateStockReservationInput(
                product_id=serializer.validated_data['product_id'],
                order_id=serializer.validated_data['order_id'],
                quantity=serializer.validated_data['quantity'],
                reservation_duration_minutes=serializer.validated_data.get(
                    'reservation_duration_minutes', 15
                ),
            )

            # Execute command
            output = command.execute(input_dto)

            return Response(
                {
                    "reservation_id": output.reservation_id,
                    "product_id": output.product_id,
                    "order_id": output.order_id,
                    "quantity": output.quantity,
                    "expires_at": output.expires_at.isoformat(),
                    "status": output.status,
                },
                status=status.HTTP_201_CREATED,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Internal error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class StockReservationDetailAPIView(APIView):
    """
    GET /api/v1/products/reservations/{id}/
    POST /api/v1/products/reservations/{id}/release/
    
    Lấy chi tiết hoặc hủy giữ kho
    """
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, reservation_id):
        """Lấy chi tiết reservation"""
        try:
            reservation_model = StockReservationModel.objects.get(id=reservation_id)
            repo = StockReservationRepositoryImpl()
            entity = repo._model_to_entity(reservation_model)

            serializer = StockReservationReadSerializer(
                {
                    "id": str(entity.id),
                    "product_id": entity.product_id,
                    "order_id": entity.order_id,
                    "quantity": entity.quantity,
                    "status": entity.status.value,
                    "expires_at": entity.expires_at,
                    "created_at": entity.created_at,
                }
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        except StockReservationModel.DoesNotExist:
            return Response(
                {"error": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request, reservation_id):
        """Hủy giữ kho"""
        serializer = ReleaseStockReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Khởi tạo repository
            stock_reservation_repo = StockReservationRepositoryImpl()

            # Khởi tạo command
            command = ReleaseStockReservationCommand(stock_reservation_repo)

            # Tạo input
            input_dto = ReleaseStockReservationInput(
                reservation_id=reservation_id,
                reason=serializer.validated_data.get("reason", "Order cancelled"),
            )

            # Execute command
            output = command.execute(input_dto)

            return Response(
                {
                    "reservation_id": output.reservation_id,
                    "status": output.status,
                    "released_at": output.released_at.isoformat(),
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Internal error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class StockReservationConfirmAPIView(APIView):
    """
    POST /api/v1/products/reservations/{id}/confirm/
    
    Xác nhận stock reservation (khi order thanh toán thành công)
    Chỉ internal services có thể gọi endpoint này
    
    Request: {} (empty body)
    
    Response:
    {
        "reservation_id": "uuid",
        "status": "CONFIRMED"
    }
    """
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, reservation_id):
        """Xác nhận reservation"""
        try:
            # Khởi tạo repository
            stock_reservation_repo = StockReservationRepositoryImpl()
            reservation = stock_reservation_repo.get_by_id(reservation_id)

            if not reservation:
                return Response(
                    {"error": "Reservation not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if reservation.status != ReservationStatus.ACTIVE:
                return Response(
                    {
                        "error": f"Cannot confirm reservation with status {reservation.status.value}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Confirm reservation
            reservation.confirm()
            updated = stock_reservation_repo.update(reservation)

            return Response(
                {
                    "reservation_id": str(updated.id),
                    "status": updated.status.value,
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Internal error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class StockReservationListAPIView(APIView):
    """
    GET /api/v1/products/reservations/list/?order_id=uuid or ?product_id=uuid
    
    Liệt kê stock reservations
    """
    authentication_classes = [InternalServiceAuthentication, JWTBearerAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lấy danh sách reservations"""
        filter_serializer = ListReservationsFilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)

        try:
            # Khởi tạo query
            repo = StockReservationRepositoryImpl()
            query = ListReservationsQuery(repo)

            # Execute query
            results = query.execute(
                order_id=filter_serializer.validated_data.get("order_id"),
                product_id=filter_serializer.validated_data.get("product_id"),
            )

            # Convert to dicts
            response_data = [
                {
                    "id": r.id,
                    "product_id": r.product_id,
                    "order_id": r.order_id,
                    "quantity": r.quantity,
                    "status": r.status,
                    "expires_at": r.expires_at,
                    "created_at": r.created_at,
                }
                for r in results
            ]

            return Response(
                response_data,
                status=status.HTTP_200_OK,
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Internal error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
