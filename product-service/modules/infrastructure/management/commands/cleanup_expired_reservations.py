# modules/infrastructure/management/commands/cleanup_expired_reservations.py
from django.core.management.base import BaseCommand
from modules.application.commands.release_stock_reservation_command import (
    ReleaseStockReservationCommand,
    ReleaseStockReservationInput,
)
from modules.infrastructure.repositories.stock_reservation_repository_impl import (
    StockReservationRepositoryImpl,
)
from modules.infrastructure.repositories.product_repository_impl import ProductRepositoryImpl
from modules.domain.entities.stock_reservation import ReservationStatus


class Command(BaseCommand):
    help = 'Cleanup expired stock reservations (auto-release quá hạn)'

    def handle(self, *args, **options):
        """
        Tìm tất cả ACTIVE reservations đã hết hạn,
        hoàn trả tồn kho và thay đổi status thành EXPIRED
        """
        repo = StockReservationRepositoryImpl()
        expired_reservations = repo.get_expired_reservations()

        if not expired_reservations:
            self.stdout.write(
                self.style.SUCCESS('No expired reservations found.')
            )
            return

        updated_count = 0
        release_command = ReleaseStockReservationCommand(repo, ProductRepositoryImpl())
        for reservation in expired_reservations:
            try:
                release_command.execute(
                    ReleaseStockReservationInput(
                        reservation_id=str(reservation.id),
                        reason="Reservation expired",
                        final_status=ReservationStatus.EXPIRED,
                    )
                )
                updated_count += 1
                self.stdout.write(
                    f"Expired reservation: {reservation.id} for order {reservation.order_id}"
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error updating reservation {reservation.id}: {str(e)}")
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully expired {updated_count} reservations.')
        )
