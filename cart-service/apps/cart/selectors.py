from apps.cart.models import Cart


def get_cart_with_items(user_id):
    """
    Fetch a Cart with its related items in a single query batch.
    Uses prefetch_related to avoid N+1 queries when accessing cart.items.
    """
    return Cart.objects.prefetch_related('items').filter(user_id=user_id).first()


def get_or_create_cart_with_items(user_id):
    """
    Get or create a Cart, then prefetch its items.
    Returns (cart, created) tuple.
    """
    cart, created = Cart.objects.get_or_create(user_id=user_id)
    # If newly created, items will be empty; otherwise, fetch them
    if not created:
        # Refresh cart with prefetch to avoid lazy-loading
        cart = Cart.objects.prefetch_related('items').get(id=cart.id)
    return cart, created
