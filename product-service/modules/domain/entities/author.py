from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class Author:
    id: str
    name: str
    bio: Optional[str] = None