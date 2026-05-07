# product-service/modules/tests/test_stock_reservation_repository.py
import pytest
from datetime import datetime, timedelta
from modules.domain.entities.stock_reservation import StockReservation, ReservationStatus
from modules.domain.repositories.stock_reservation_repository import StockReservationRepository
from modules.infrastructure.repositories.stock_reservation_repository_impl import (
    StockReservationRepositoryImpl,
)
from modules.infrastructure.models.sock_reservation_model import StockReservationModel
from modules.infrastructure.models.product_model import ProductModel


@pytest.mark.django_db
class TestStockReservationRepository:
    """Test StockReservationRepositoryImpl"""

    @pytest.fixture
    def product(self):
        """Tạo product fixture"""
        product = ProductModel.objects.create(
            name="Test Product",
            slug="test-product",
            price=100.0,
            import_price=50.0,
            stock=100,
        )
        return product

    @pytest.fixture
    def repository(self):
        """Tạo repository instance"""
        return StockReservationRepositoryImpl()

    def test_create_reservation(self, repository, product):
        """Test tạo stock reservation"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        reservation = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )

        created = repository.create(reservation)

        assert created.id is not None
        assert created.product_id == str(product.id)
        assert created.order_id == order_id
        assert created.quantity == 5
        assert created.status == ReservationStatus.ACTIVE

    def test_get_by_id(self, repository, product):
        """Test lấy reservation theo ID"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        reservation = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )

        created = repository.create(reservation)
        fetched = repository.get_by_id(str(created.id))

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.quantity == 5

    def test_get_by_order_id(self, repository, product):
        """Test lấy tất cả reservations của order"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        # Create 2 reservations cho cùng 1 order
        for i in range(2):
            reservation = StockReservation(
                id=None,
                product_id=str(product.id),
                order_id=order_id,
                quantity=5,
                expires_at=expires_at,
                status=ReservationStatus.ACTIVE,
                created_at=datetime.utcnow(),
            )
            repository.create(reservation)

        results = repository.get_by_order_id(order_id)

        assert len(results) == 2
        assert all(r.order_id == order_id for r in results)

    def test_get_active_reservations_by_product(self, repository, product):
        """Test lấy ACTIVE reservations của product"""
        order_id_1 = "550e8400-e29b-41d4-a716-446655440000"
        order_id_2 = "550e8400-e29b-41d4-a716-446655440001"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        # Create 1 ACTIVE reservation
        res1 = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id_1,
            quantity=5,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )
        created1 = repository.create(res1)

        # Create 1 RELEASED reservation
        res2 = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id_2,
            quantity=3,
            expires_at=expires_at,
            status=ReservationStatus.RELEASED,
            created_at=datetime.utcnow(),
        )
        repository.create(res2)

        results = repository.get_active_reservations_by_product(str(product.id))

        assert len(results) == 1
        assert results[0].status == ReservationStatus.ACTIVE
        assert results[0].quantity == 5

    def test_get_expired_reservations(self, repository, product):
        """Test lấy expired reservations"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        
        # Create ACTIVE reservation đã hết hạn
        expired_at = datetime.utcnow() - timedelta(minutes=5)
        res1 = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            expires_at=expired_at,  # Quá hạn
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )
        repository.create(res1)

        # Create ACTIVE reservation chưa hết hạn
        future_at = datetime.utcnow() + timedelta(minutes=10)
        res2 = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=3,
            expires_at=future_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )
        repository.create(res2)

        results = repository.get_expired_reservations()

        assert len(results) >= 1
        assert all(r.status == ReservationStatus.ACTIVE for r in results)

    def test_update_reservation(self, repository, product):
        """Test update reservation"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        reservation = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )

        created = repository.create(reservation)
        
        # Change status to RELEASED
        created.status = ReservationStatus.RELEASED
        updated = repository.update(created)

        assert updated.status == ReservationStatus.RELEASED

    def test_delete_reservation(self, repository, product):
        """Test delete reservation"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        reservation = StockReservation(
            id=None,
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE,
            created_at=datetime.utcnow(),
        )

        created = repository.create(reservation)
        repository.delete(str(created.id))

        fetched = repository.get_by_id(str(created.id))
        assert fetched is None
