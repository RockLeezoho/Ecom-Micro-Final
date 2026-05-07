export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'sach-luu-tru' | 'thiet-bi-dien-tu' | 'thoi-trang-may-mac';
  subCategory: string;
  rating: number;
  origin: string;
  image: string;
  description: string;
  stock: number;
  isBestSelling?: boolean;
  isFavorite?: boolean;
  isSuggested?: boolean;
  categoryId?: string;
  author?: string;
  brand?: string;
  language?: string;
  color?: string;
  material?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selected?: boolean;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  staffCode?: string;
  employmentType?: 'Full-time' | 'Part-time';
  height?: number | null;
  weight?: number | null;
  footLength?: number | null;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  shippingFee: number;
  address: string;
  shippingMethod: 'standard' | 'express';
  paymentMethod: 'cod' | 'bank_transfer' | 'e_wallet' | 'credit_card';
  status: 'awaiting_confirmation' | 'awaiting_pickup' | 'awaiting_delivery' | 'delivered' | 'canceled';
  paymentStatus: 'paid' | 'unpaid';
  createdAt: string;
  weight?: number;
  priority?: 'standard' | 'express';
  carrier?: string;
  region?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface HomepageData {
  new_arrivals: Product[];
  popular: Product[];
  recommended: Product[];
  best_sellers: Product[];
}