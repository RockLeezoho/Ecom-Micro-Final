# modules/catalog/domain/entities/product.py
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from enum import Enum

from .author import Author
from .brand import Brand
from .category import Category
from .publisher import Publisher
from .image import ProductImage

# --- ENUMS (Các hằng số giá trị) ---

class ProductStatus(str, Enum):
    NEW = "NEW"
    SELLING = "SELLING"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    DISCONTINUED = "DISCONTINUED"

class Origin(str, Enum):
    VIETNAM = "Vietnam"; CHINA = "China"; USA = "American"
    JAPAN = "Japan"; KOREA = "Korean"; ENGLAND = "England"
    FRANCE = "France"; THAILAND = "Thailand"

class Language(str, Enum):
    VIETNAMESE = "Vietnamese"
    ENGLISH = "English"
    JAPANESE = "Japanese"
    CHINESE = "Chinese"
    FRENCH = "French"

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    UNISEX = "Unisex"

class Size(str, Enum):
    S = "S"; M = "M"; L = "L"; XL = "XL"; XXL = "XXL"; XXXL = "XXXL"
    S30 = "30"; S31 = "31"; S32 = "32"; S33 = "33"; S34 = "34"
    S35 = "35"; S36 = "36"; S37 = "37"; S38 = "38"; S39 = "39"
    S40 = "40"; S41 = "41"; S42 = "42"; S43 = "43"; S44 = "44"; S45 = "45"

class Color(str, Enum):
    WHITE = "White"; BLACK = "Black"; GRAY = "Gray"
    RED = "Red"; BLUE = "Blue"; GREEN = "Green"
    YELLOW = "Yellow"; PINK = "Pink"; PURPLE = "Purple"
    BROWN = "Brown"; MULTI = "Multi-color" 

class Material(str, Enum):
    COTTON = "cotton"; LEATHER = "leather"; POLYESTER = "polyester"

class Season(str, Enum):
    SPRING = "spring"; SUMMER = "summer"; AUTUMN = "autumn"; WINTER = "winter"

class Condition(str, Enum):
    NEW = "new"; OPEN_BOX = "open_box"; REFURBISHED = "refurbished"

# --- MAIN ENTITIES ---

@dataclass
class Product:
    id: str
    name: str
    origin: Origin
    price: float
    importPrice: float
    stock: int
    rating: float
    status: ProductStatus
    viewCount: int
    category: Category
    brand: Brand
    color: Color
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[ProductImage] = None  # avatar image
    images: List[ProductImage] = field(default_factory=list)
    createdAt: datetime = None
    updatedAt: datetime = None

@dataclass
class Book(Product):
    author: Optional[Author] = None
    publisher: Optional[Publisher] = None
    pubDate: Optional[str] = None
    language: Optional[Language] = None
    pageCount: Optional[int] = None
    format: Optional[str] = None

@dataclass
class Fashion(Product):
    size: Optional[Size] = None
    material: Optional[Material] = None
    gender: Optional[Gender] = None
    season: Optional[Season] = None

@dataclass
class Electronic(Product):
    model: Optional[str] = None
    techSpec: Optional[Dict[str, Any]] = None
    warrantyPeriod: Optional[date] = None
    condition: Optional[Condition] = None
    voltage: Optional[float] = None