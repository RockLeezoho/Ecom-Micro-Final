from dataclasses import dataclass, field 
from typing import List, Optional

@dataclass
class Category:
    id: str
    name: str
    slug: str  
    description: Optional[str] = None
    parent: Optional['Category'] = None  # Thêm parent để truy ngược lên trên
    children: List['Category'] = field(default_factory=list)
    