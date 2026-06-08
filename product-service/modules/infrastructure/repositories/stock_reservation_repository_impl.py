# modules/infrastructure/repositories/stock_reservation_repository_impl.py
import uuid
from typing import List, Optional
from datetime import datetime
from django.db.models import Q
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository
from modules.domain.entities.stock_reservation import (
    StockReservation,
    ReservationStatus,
    normalize_reservation_status,
)
from modules.infrastructure.models.sock_reservation_model import StockReservationModel
from modules.infrastructure.models.product_model import ProductModel


class StockReservationRepositoryImpl(StockReservationRepository):
    """Infrastructure: Concrete implementation của StockReservationRepository"""

    @staticmethod
    def _enum_db_value(value):
        return value.value if hasattr(value, "value") else value

    def create(self, reservation: StockReservation) -> StockReservation:
        """Tạo reservation mới"""
        
        # Generate ID nếu chưa có
        if not reservation.id:
            reservation.id = str(uuid.uuid4())

        # Lấy product model
        product_model = ProductModel.objects.get(id=reservation.product_id)

        # Tạo model
        model = StockReservationModel.objects.create(
            id=reservation.id,
            product=product_model,
            order_id=reservation.order_id,
            quantity=reservation.quantity,
            expires_at=reservation.expires_at,
            status=self._enum_db_value(normalize_reservation_status(reservation.status)),
            created_at=reservation.created_at,
        )

        return self._model_to_entity(model)

    def get_by_id(self, reservation_id: str) -> Optional[StockReservation]:
        """Lấy reservation theo ID"""
        try:
            model = StockReservationModel.objects.get(id=reservation_id)
            return self._model_to_entity(model)
        except StockReservationModel.DoesNotExist:
            return None

    def get_by_order_id(self, order_id: str) -> List[StockReservation]:
        """Lấy tất cả reservations của 1 đơn hàng"""
        models = StockReservationModel.objects.filter(order_id=order_id).order_by('-created_at')
        return [self._model_to_entity(m) for m in models]

    def get_by_product_id(
        self, 
        product_id: str, 
        status: Optional[ReservationStatus] = None
    ) -> List[StockReservation]:
        """Lấy reservations của 1 sản phẩm"""
        query = StockReservationModel.objects.filter(product_id=product_id)
        
        if status:
            query = query.filter(status=self._enum_db_value(normalize_reservation_status(status)))
        
        models = query.order_by('-created_at')
        return [self._model_to_entity(m) for m in models]

    def update(self, reservation: StockReservation) -> StockReservation:
        """Cập nhật reservation"""
        model = StockReservationModel.objects.get(id=reservation.id)
        model.quantity = reservation.quantity
        model.status = self._enum_db_value(normalize_reservation_status(reservation.status))
        model.expires_at = reservation.expires_at
        
        if hasattr(reservation, 'released_at') and reservation.released_at:
            model.updated_at = reservation.released_at
        
        model.save()
        return self._model_to_entity(model)

    def delete(self, reservation_id: str) -> None:
        """Xóa reservation"""
        StockReservationModel.objects.filter(id=reservation_id).delete()

    def get_active_reservations_by_product(self, product_id: str) -> List[StockReservation]:
        """Lấy tất cả ACTIVE reservations của sản phẩm"""
        models = StockReservationModel.objects.filter(
            product_id=product_id,
            status=ReservationStatus.ACTIVE.value,
            expires_at__gt=datetime.utcnow()  # Chưa quá hạn
        )
        return [self._model_to_entity(m) for m in models]

    def get_expired_reservations(self) -> List[StockReservation]:
        """Lấy tất cả reservations đã hết hạn"""
        models = StockReservationModel.objects.filter(
            status=ReservationStatus.ACTIVE.value,
            expires_at__lt=datetime.utcnow()  # Quá hạn
        )
        return [self._model_to_entity(m) for m in models]

    def _model_to_entity(self, model: StockReservationModel) -> StockReservation:
        """Convert Django Model -> Domain Entity"""
        return StockReservation(
            id=str(model.id),
            product_id=str(model.product_id),
            order_id=str(model.order_id),
            quantity=model.quantity,
            expires_at=model.expires_at,
            status=normalize_reservation_status(model.status),
            created_at=model.created_at,
        )
