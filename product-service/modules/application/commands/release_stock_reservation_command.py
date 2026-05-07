# modules/application/commands/release_stock_reservation_command.py
from dataclasses import dataclass
from datetime import datetime
from modules.domain.entities.stock_reservation import ReservationStatus
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository


@dataclass
class ReleaseStockReservationInput:
    """Input DTO để hủy giữ kho"""
    reservation_id: str
    reason: str = "Order cancelled"


@dataclass
class ReleaseStockReservationOutput:
    """Output DTO"""
    reservation_id: str
    status: str
    released_at: datetime


class ReleaseStockReservationCommand:
    """Use Case: Hủy giữ stock (release reservation)"""

    def __init__(self, stock_reservation_repository: StockReservationRepository):
        self.stock_reservation_repository = stock_reservation_repository

    def execute(self, input_dto: ReleaseStockReservationInput) -> ReleaseStockReservationOutput:
        """
        Hủy stock reservation.
        
        Quy trình:
        1. Lấy reservation
        2. Validate trạng thái là ACTIVE
        3. Thay đổi status thành RELEASED
        4. Lưu lại
        """
        
        # 1. Lấy reservation
        reservation = self.stock_reservation_repository.get_by_id(input_dto.reservation_id)
        if not reservation:
            raise ValueError(f"Reservation {input_dto.reservation_id} not found")

        # 2. Validate trạng thái
        if reservation.status != ReservationStatus.ACTIVE:
            raise ValueError(
                f"Cannot release reservation with status {reservation.status}. "
                f"Only ACTIVE reservations can be released."
            )

        # 3. Thay đổi trạng thái
        reservation.release(reason=input_dto.reason)

        # 4. Lưu lại
        updated_reservation = self.stock_reservation_repository.update(reservation)

        return ReleaseStockReservationOutput(
            reservation_id=str(updated_reservation.id),
            status=updated_reservation.status.value,
            released_at=updated_reservation.released_at,
        )
