.PHONY: help seed-user-service seed-product-service seed-payment-service seed-order-service seed-cart-service seed-shipping-service

help:
	@echo "seed-user-service    Seed the user-service DB via docker compose exec"
	@echo "seed-product-service Seed the product-service DB via docker compose exec"
	@echo "seed-payment-service Seed the payment-service DB via docker compose exec"
	@echo "seed-order-service   Seed the order-service DB via docker compose exec"
	@echo "seed-cart-service    Seed the cart-service DB via docker compose exec"
	@echo "seed-shipping-service Seed the shipping-service DB via docker compose exec"

seed-user-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T user-service python manage.py seed_users --refresh

seed-product-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T product-service python manage.py seed_products --refresh

seed-payment-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T payment-service python manage.py seed_payment

seed-order-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T order-service python manage.py seed_order

seed-cart-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T cart-service python manage.py seed_cart

seed-shipping-service:
	@docker compose -f infrastructure/docker-compose.yml exec -T shipping-service python manage.py seed_shipping
