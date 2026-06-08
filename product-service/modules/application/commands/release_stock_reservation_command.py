# modules/application/commands/release_stock_reservation_command.py
from dataclasses import dataclass
from datetime import datetime
from django.db import transaction
from modules.domain.entities.stock_reservation import ReservationStatus, normalize_reservation_status
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository
from modules.domain.repositories.product_repository import ProductRepository
from modules.infrastructure.repositories.product_repository_impl import ProductRepositoryImpl


@dataclass
class ReleaseStockReservationInput:
    """Input DTO để hủy giữ kho"""
    reservation_id: str
    reason: str = "Order cancelled"
    final_status: ReservationStatus = ReservationStatus.RELEASED


@dataclass
class ReleaseStockReservationOutput:
    """Output DTO"""
    reservation_id: str
    status: str
    released_at: datetime


class ReleaseStockReservationCommand:
    """Use Case: Hủy giữ stock (release reservation)"""

    def __init__(self, stock_reservation_repository: StockReservationRepository, product_repository: ProductRepository | None = None):
        self.stock_reservation_repository = stock_reservation_repository
        self.product_repository = product_repository or ProductRepositoryImpl()

    def execute(self, input_dto: ReleaseStockReservationInput) -> ReleaseStockReservationOutput:
        """
        Hủy stock reservation và hoàn trả tồn kho.
        
        Quy trình:
        1. Lấy reservation
        2. Validate trạng thái là ACTIVE
        3. Hoàn trả tồn kho cho product
        4. Thay đổi status thành RELEASED
        5. Lưu lại
        """
        with transaction.atomic():
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

            # 3. Hoàn trả tồn kho cho product
            if self.product_repository is not None:
                product = self.product_repository.get_by_id(reservation.product_id)
                if not product:
                    raise ValueError(f"Product {reservation.product_id} not found")
                product.stock = int(product.stock or 0) + reservation.quantity
                self.product_repository.update(product)

            # 4. Thay đổi trạng thái
            reservation.release(reason=input_dto.reason)
            reservation.status = normalize_reservation_status(input_dto.final_status)

            # 5. Lưu lại
            updated_reservation = self.stock_reservation_repository.update(reservation)

            return ReleaseStockReservationOutput(
                reservation_id=str(updated_reservation.id),
                status=normalize_reservation_status(updated_reservation.status).value,
                released_at=updated_reservation.released_at,
            )
