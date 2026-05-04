from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass(frozen=True)
class ProductImage:
    id: str
    product_id: str
    image_url: str
    public_id: str
    is_avatar: bool
    created_at: datetime
