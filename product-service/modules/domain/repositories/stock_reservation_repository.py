# modules/domain/repositories/stock_reservation_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional
from modules.domain.entities.stock_reservation import StockReservation, ReservationStatus


class StockReservationRepository(ABC):
    """Port: Abstract repository cho Stock Reservation"""

    @abstractmethod
    def create(self, reservation: StockReservation) -> StockReservation:
        """Tạo reservation mới"""
        pass

    @abstractmethod
    def get_by_id(self, reservation_id: str) -> Optional[StockReservation]:
        """Lấy reservation theo ID"""
        pass

    @abstractmethod
    def get_by_order_id(self, order_id: str) -> List[StockReservation]:
        """Lấy tất cả reservations của 1 đơn hàng"""
        pass

    @abstractmethod
    def get_by_product_id(self, product_id: str, status: ReservationStatus = None) -> List[StockReservation]:
        """Lấy reservations của 1 sản phẩm"""
        pass

    @abstractmethod
    def update(self, reservation: StockReservation) -> StockReservation:
        """Cập nhật reservation"""
        pass

    @abstractmethod
    def delete(self, reservation_id: str) -> None:
        """Xóa reservation"""
        pass

    @abstractmethod
    def get_active_reservations_by_product(self, product_id: str) -> List[StockReservation]:
        """Lấy tất cả ACTIVE reservations của sản phẩm (để tính reserved quantity)"""
        pass

    @abstractmethod
    def get_expired_reservations(self) -> List[StockReservation]:
        """Lấy tất cả reservations đã hết hạn"""
        pass
