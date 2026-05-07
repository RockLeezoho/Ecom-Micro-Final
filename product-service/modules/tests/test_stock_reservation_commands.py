# product-service/modules/tests/test_stock_reservation_commands.py
import pytest
from datetime import datetime, timedelta
from modules.domain.entities.stock_reservation import ReservationStatus
from modules.application.commands.create_stock_reservation_command import (
    CreateStockReservationCommand,
    CreateStockReservationInput,
)
from modules.application.commands.release_stock_reservation_command import (
    ReleaseStockReservationCommand,
    ReleaseStockReservationInput,
)
from modules.application.commands.confirm_stock_reservation_command import (
    ConfirmStockReservationCommand,
    ConfirmStockReservationInput,
)
from modules.infrastructure.repositories.stock_reservation_repository_impl import (
    StockReservationRepositoryImpl,
)
from modules.infrastructure.repositories.product_repository_impl import ProductRepositoryImpl
from modules.infrastructure.models.product_model import ProductModel


@pytest.mark.django_db
class TestCreateStockReservationCommand:
    """Test CreateStockReservationCommand"""

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
    def command(self):
        return CreateStockReservationCommand(
            StockReservationRepositoryImpl(),
            ProductRepositoryImpl(),
        )

    def test_create_reservation_success(self, command, product):
        """Test tạo reservation thành công"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        input_dto = CreateStockReservationInput(
            product_id=str(product.id),
            order_id=order_id,
            quantity=5,
            reservation_duration_minutes=15,
        )

        output = command.execute(input_dto)

        assert output.reservation_id is not None
        assert output.product_id == str(product.id)
        assert output.quantity == 5
        assert output.status == "ACTIVE"

    def test_create_reservation_insufficient_stock(self, command, product):
        """Test tạo reservation khi stock không đủ"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        input_dto = CreateStockReservationInput(
            product_id=str(product.id),
            order_id=order_id,
            quantity=150,  # Stock chỉ có 100
            reservation_duration_minutes=15,
        )

        with pytest.raises(ValueError) as exc_info:
            command.execute(input_dto)

        assert "Insufficient stock" in str(exc_info.value)

    def test_create_reservation_product_not_found(self, command):
        """Test tạo reservation với product không tồn tại"""
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        nonexistent_id = "550e8400-e29b-41d4-a716-446655440999"
        
        input_dto = CreateStockReservationInput(
            product_id=nonexistent_id,
            order_id=order_id,
            quantity=5,
            reservation_duration_minutes=15,
        )

        with pytest.raises(ValueError) as exc_info:
            command.execute(input_dto)

        assert "not found" in str(exc_info.value)

    def test_create_multiple_reservations(self, command, product):
        """Test tạo nhiều reservations cho cùng 1 product"""
        # Create 2 reservations, mỗi cái 30
        # Remaining: 100 - 30 - 30 = 40
        
        order_id_1 = "550e8400-e29b-41d4-a716-446655440000"
        input_dto_1 = CreateStockReservationInput(
            product_id=str(product.id),
            order_id=order_id_1,
            quantity=30,
            reservation_duration_minutes=15,
        )
        output_1 = command.execute(input_dto_1)
        assert output_1.quantity == 30

        order_id_2 = "550e8400-e29b-41d4-a716-446655440001"
        input_dto_2 = CreateStockReservationInput(
            product_id=str(product.id),
            order_id=order_id_2,
            quantity=30,
            reservation_duration_minutes=15,
        )
        output_2 = command.execute(input_dto_2)
        assert output_2.quantity == 30

        # 3rd should fail (only 40 left)
        order_id_3 = "550e8400-e29b-41d4-a716-446655440002"
        input_dto_3 = CreateStockReservationInput(
            product_id=str(product.id),
            order_id=order_id_3,
            quantity=50,
            reservation_duration_minutes=15,
        )

        with pytest.raises(ValueError):
            command.execute(input_dto_3)


@pytest.mark.django_db
class TestReleaseStockReservationCommand:
    """Test ReleaseStockReservationCommand"""

    @pytest.fixture
    def setup_reservation(self):
        """Setup: Create product + reservation"""
        product = ProductModel.objects.create(
            name="Test Product",
            slug="test-product",
            price=100.0,
            import_price=50.0,
            stock=100,
        )
        
        repo = StockReservationRepositoryImpl()
        product_repo = ProductRepositoryImpl()
        
        # Create reservation
        create_cmd = CreateStockReservationCommand(repo, product_repo)
        input_dto = CreateStockReservationInput(
            product_id=str(product.id),
            order_id="550e8400-e29b-41d4-a716-446655440000",
            quantity=5,
            reservation_duration_minutes=15,
        )
        output = create_cmd.execute(input_dto)
        
        return output.reservation_id, repo

    @pytest.fixture
    def command(self):
        return ReleaseStockReservationCommand(StockReservationRepositoryImpl())

    def test_release_reservation_success(self, command, setup_reservation):
        """Test hủy giữ kho thành công"""
        reservation_id, _ = setup_reservation
        
        input_dto = ReleaseStockReservationInput(
            reservation_id=reservation_id,
            reason="Customer cancelled",
        )

        output = command.execute(input_dto)

        assert output.reservation_id == reservation_id
        assert output.status == "RELEASED"

    def test_release_nonexistent_reservation(self, command):
        """Test hủy reservation không tồn tại"""
        input_dto = ReleaseStockReservationInput(
            reservation_id="550e8400-e29b-41d4-a716-446655440999",
            reason="Test",
        )

        with pytest.raises(ValueError) as exc_info:
            command.execute(input_dto)

        assert "not found" in str(exc_info.value)


@pytest.mark.django_db
class TestConfirmStockReservationCommand:
    """Test ConfirmStockReservationCommand"""

    @pytest.fixture
    def setup_order_with_reservations(self):
        """Setup: Create order with multiple reservations"""
        product1 = ProductModel.objects.create(
            name="Product 1",
            slug="product-1",
            price=100.0,
            import_price=50.0,
            stock=100,
        )
        product2 = ProductModel.objects.create(
            name="Product 2",
            slug="product-2",
            price=200.0,
            import_price=100.0,
            stock=50,
        )
        
        repo = StockReservationRepositoryImpl()
        product_repo = ProductRepositoryImpl()
        create_cmd = CreateStockReservationCommand(repo, product_repo)
        
        order_id = "550e8400-e29b-41d4-a716-446655440000"
        
        # Create 2 reservations cho order này
        for i, product in enumerate([product1, product2], 1):
            input_dto = CreateStockReservationInput(
                product_id=str(product.id),
                order_id=order_id,
                quantity=5,
                reservation_duration_minutes=15,
            )
            create_cmd.execute(input_dto)
        
        return order_id, repo

    @pytest.fixture
    def command(self):
        return ConfirmStockReservationCommand(StockReservationRepositoryImpl())

    def test_confirm_all_reservations(self, command, setup_order_with_reservations):
        """Test xác nhận tất cả reservations của order"""
        order_id, _ = setup_order_with_reservations
        
        input_dto = ConfirmStockReservationInput(order_id=order_id)
        output = command.execute(input_dto)

        assert output.order_id == order_id
        assert output.count == 2  # 2 items

    def test_confirm_nonexistent_order(self, command):
        """Test xác nhận order không có reservation"""
        input_dto = ConfirmStockReservationInput(
            order_id="550e8400-e29b-41d4-a716-446655440999"
        )

        with pytest.raises(ValueError):
            command.execute(input_dto)
