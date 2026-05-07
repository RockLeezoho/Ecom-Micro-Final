# modules/application/commands/confirm_stock_reservation_command.py
from dataclasses import dataclass
from modules.domain.entities.stock_reservation import ReservationStatus
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository


@dataclass
class ConfirmStockReservationInput:
    """Input DTO để xác nhận reservation (order thanh toán thành công)"""
    order_id: str


@dataclass
class ConfirmStockReservationOutput:
    """Output DTO"""
    order_id: str
    count: int  # Số lượng reservation được confirm


class ConfirmStockReservationCommand:
    """Use Case: Xác nhận stock reservation (khi order thanh toán thành công)"""

    def __init__(self, stock_reservation_repository: StockReservationRepository):
        self.stock_reservation_repository = stock_reservation_repository

    def execute(self, input_dto: ConfirmStockReservationInput) -> ConfirmStockReservationOutput:
        """
        Xác nhận tất cả reservations của 1 đơn hàng.
        Thường được gọi sau khi payment success.
        
        Quy trình:
        1. Lấy tất cả ACTIVE reservations của order
        2. Thay đổi status thành CONFIRMED
        3. Lưu tất cả
        """
        
        # 1. Lấy tất cả reservations của order
        reservations = self.stock_reservation_repository.get_by_order_id(input_dto.order_id)
        
        if not reservations:
            raise ValueError(f"No reservations found for order {input_dto.order_id}")

        # 2. Xác nhận ACTIVE reservations
        confirmed_count = 0
        for reservation in reservations:
            if reservation.status == ReservationStatus.ACTIVE:
                reservation.confirm()
                self.stock_reservation_repository.update(reservation)
                confirmed_count += 1

        return ConfirmStockReservationOutput(
            order_id=input_dto.order_id,
            count=confirmed_count,
        )
