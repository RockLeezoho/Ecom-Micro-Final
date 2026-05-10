from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum


class ReservationStatus(str, Enum):
    ACTIVE = "ACTIVE" 
    RELEASED = "RELEASED" 
    CONFIRMED = "CONFIRMED"
    EXPIRED = "EXPIRED" 


@dataclass
class StockReservation:
    """Domain Entity cho Stock Reservation (Giữ kho)"""
    id: str
    product_id: str
    order_id: str
    quantity: int
    expires_at: datetime
    status: ReservationStatus
    created_at: datetime
    released_at: Optional[datetime] = None
    reason: Optional[str] = None  # Lý do hủy giữ

    def is_expired(self) -> bool:
        """Kiểm tra xem reservation đã hết hạn hay chưa"""
        return datetime.utcnow() > self.expires_at and self.status == ReservationStatus.ACTIVE

    def release(self, reason: str = "Manual release") -> None:
        """Hủy giữ stock"""
        if self.status != ReservationStatus.ACTIVE:
            raise ValueError(f"Cannot release non-active reservation. Status: {self.status}")
        self.status = ReservationStatus.RELEASED
        self.released_at = datetime.utcnow()
        self.reason = reason

    def confirm(self) -> None:
        """Xác nhận reservation (đơn hàng được thanh toán)"""
        if self.status != ReservationStatus.ACTIVE:
            raise ValueError(f"Cannot confirm non-active reservation. Status: {self.status}")
        self.status = ReservationStatus.CONFIRMED