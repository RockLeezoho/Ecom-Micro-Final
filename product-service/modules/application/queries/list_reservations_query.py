# modules/application/queries/list_reservations_query.py
from dataclasses import dataclass
from typing import List, Optional
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository


@dataclass
class ListReservationsOutput:
    """Output DTO"""
    id: str
    product_id: str
    order_id: str
    quantity: int
    status: str
    expires_at: str
    created_at: str


class ListReservationsQuery:
    """Query: Lấy danh sách reservations theo filter"""

    def __init__(self, stock_reservation_repository: StockReservationRepository):
        self.stock_reservation_repository = stock_reservation_repository

    def execute(
        self, 
        order_id: Optional[str] = None,
        product_id: Optional[str] = None,
    ) -> List[ListReservationsOutput]:
        """
        Lấy danh sách reservations
        """
        
        reservations = []
        
        if order_id:
            reservations = self.stock_reservation_repository.get_by_order_id(order_id)
        elif product_id:
            reservations = self.stock_reservation_repository.get_by_product_id(product_id)
        else:
            # Nếu không filter, lấy tất cả expired reservations để cleanup
            reservations = self.stock_reservation_repository.get_expired_reservations()

        return [
            ListReservationsOutput(
                id=str(r.id),
                product_id=r.product_id,
                order_id=r.order_id,
                quantity=r.quantity,
                status=r.status.value,
                expires_at=r.expires_at.isoformat(),
                created_at=r.created_at.isoformat(),
            )
            for r in reservations
        ]
