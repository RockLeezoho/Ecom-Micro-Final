from dataclasses import dataclass, field
from typing import Optional
@dataclass(frozen=True)
class Publisher:
    id: str
    name: str
    address: Optional[str] = None