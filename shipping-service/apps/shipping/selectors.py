from __future__ import annotations

from typing import Iterable

from apps.shipping.models import Shipment


def get_shipment_with_relations(shipment_id: str) -> Shipment:
    """Return a Shipment with commonly-needed related objects prefetched.

    - `carrier` is a ForeignKey -> use select_related
    - `logs` is a reverse FK -> use prefetch_related
    """
    return (
        Shipment.objects.select_related("carrier")
        .prefetch_related("logs")
        .get(id=shipment_id)
    )


def list_shipments_for_user(user_id: str) -> Iterable[Shipment]:
    """List shipments for a user with carrier and logs eager-loaded."""
    return (
        Shipment.objects.filter(user_id=user_id)
        .select_related("carrier")
        .prefetch_related("logs")
        .order_by("-created_at")
    )
