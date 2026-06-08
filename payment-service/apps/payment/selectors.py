from apps.payment.models import Payment


def get_payment_by_reference(reference_number):
    """
    Return a Payment by reference_number.

If the `Payment` model later gains ForeignKey relations (e.g., `order`, `user`),
add `.select_related('order', 'user')` or `.prefetch_related(...)` here.
"""
    # current schema uses UUID fields for order_id/user_id so select_related is a no-op
    return Payment.objects.filter(reference_number=reference_number).first()


def get_payment_by_id(payment_id):
    """Fetch Payment by primary key. Prepared for future eager-loading."""
    return Payment.objects.filter(id=payment_id).first()
