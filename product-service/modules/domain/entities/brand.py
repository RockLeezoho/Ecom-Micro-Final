from dataclasses import dataclass, field
from typing import Optional
@dataclass
class Brand:
    id: str
    name: str
    logoUrl: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
