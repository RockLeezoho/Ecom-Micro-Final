import { Product, User, Order } from '../types';

export const mockProducts: Product[] = [
  // Books
  {
    id: 'b1',
    name: 'Clean Code: Sách hướng dẫn về kỹ năng lập trình hướng đối tượng',
    price: 850000,
    category: 'books',
    subCategory: 'textbooks',
    rating: 4.8,
    origin: 'Mỹ',
    image: 'https://picsum.photos/seed/clean_code/400/600',
    description: 'Ngay cả mã kém vẫn có thể hoạt động. Nhưng nếu mã không sạch, nó có thể làm sụp đổ một tổ chức phát triển phần mềm.',
    stock: 50,
    isBestSelling: true,
    isSuggested: true
  },
  {
    id: 'b2',
    name: 'Đại gia Gatsby',
    price: 150000,
    category: 'books',
    subCategory: 'novels',
    rating: 4.5,
    origin: 'Anh',
    image: 'https://picsum.photos/seed/gatsby/400/600',
    description: 'Một câu chuyện kinh điển về sự giàu có, tình yêu và Giấc mơ Mỹ.',
    stock: 100,
    isFavorite: true
  },
  {
    id: 'b3',
    name: 'One Piece, Tập 100',
    price: 25000,
    category: 'books',
    subCategory: 'comics',
    rating: 4.9,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/one_piece/400/600',
    description: 'Tham gia cùng Luffy và phi hành đoàn dũng cảm của mình trong cuộc tìm kiếm kho báu tối thượng, One Piece.',
    stock: 200,
    isBestSelling: true
  },
  // ...existing code...
  // Thêm nhiều sản phẩm Books
  {
    id: 'b6',
    name: 'Totto-chan bên cửa sổ',
    price: 95000,
    category: 'books',
    subCategory: 'novels',
    rating: 4.7,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/tottochan/400/600',
    description: 'Câu chuyện cảm động về tuổi thơ và giáo dục.',
    stock: 120,
    author: 'Tetsuko Kuroyanagi',
    language: 'Tiếng Việt'
  },
  {
    id: 'b7',
    name: 'Dế mèn phiêu lưu ký',
    price: 60000,
    category: 'books',
    subCategory: 'comics',
    rating: 4.3,
    origin: 'Việt Nam',
    image: 'https://picsum.photos/seed/demen/400/600',
    description: 'Tác phẩm thiếu nhi nổi tiếng của Tô Hoài.',
    stock: 90,
    author: 'Tô Hoài',
    language: 'Tiếng Việt'
  },
  // Electronics
  {
    id: 'e6',
    name: 'Máy giặt LG Inverter',
    price: 7800000,
    category: 'electronics',
    subCategory: 'washing machines',
    rating: 4.1,
    origin: 'Hàn Quốc',
    image: 'https://picsum.photos/seed/lg/400/400',
    description: 'Tiết kiệm điện, vận hành êm ái.',
    stock: 12,
    brand: 'LG',
    color: 'Bạc'
  },
  {
    id: 'e7',
    name: 'Máy lạnh Daikin Inverter',
    price: 9500000,
    category: 'electronics',
    subCategory: 'air conditioners',
    rating: 4.5,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/daikin/400/400',
    description: 'Làm lạnh nhanh, tiết kiệm điện.',
    stock: 8,
    brand: 'Daikin',
    color: 'Trắng'
  },
  // Fashion
  {
    id: 'f6',
    name: 'Váy maxi hoa nhí',
    price: 350000,
    category: 'fashion',
    subCategory: 'dresses',
    rating: 4.2,
    origin: 'Việt Nam',
    image: 'https://picsum.photos/seed/maxi/400/500',
    description: 'Phong cách nữ tính, nhẹ nhàng.',
    stock: 60,
    brand: 'IVY Moda',
    material: 'Cotton'
  },
  {
    id: 'f7',
    name: 'Áo thun nam cổ tròn',
    price: 120000,
    category: 'fashion',
    subCategory: 't-shirts',
    rating: 4.0,
    origin: 'Việt Nam',
    image: 'https://picsum.photos/seed/tshirt/400/500',
    description: 'Chất liệu cotton thoáng mát.',
    stock: 200,
    brand: 'Coolmate',
    material: 'Cotton'
  },
  {
    id: 'b3',
    name: 'One Piece, Tập 100',
    price: 25000,
    category: 'books',
    subCategory: 'comics',
    rating: 4.9,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/one_piece/400/600',
    description: 'Tham gia cùng Luffy và phi hành đoàn dũng cảm của mình trong cuộc tìm kiếm kho báu tối thượng, One Piece.',
    stock: 200,
    isBestSelling: true
  },
  // Electronics
  {
    id: 'e1',
    name: 'iPhone 15 Pro Max',
    price: 32900000,
    category: 'electronics',
    subCategory: 'mobile phones',
    rating: 4.9,
    origin: 'Mỹ',
    image: 'https://picsum.photos/seed/iphone15/400/400',
    description: 'Trải nghiệm iPhone đỉnh cao với chip A17 Pro và thiết kế Titan.',
    stock: 20,
    isBestSelling: true,
    isSuggested: true
  },
  {
    id: 'e2',
    name: 'MacBook Air M2',
    price: 26500000,
    category: 'electronics',
    subCategory: 'laptops',
    rating: 4.7,
    origin: 'Mỹ',
    image: 'https://picsum.photos/seed/macbook/400/400',
    description: 'Được hỗ trợ bởi chip M2, mỏng và nhanh đáng kể.',
    stock: 15,
    isFavorite: true
  },
  {
    id: 'e3',
    name: 'Tủ lạnh Samsung 4 cửa',
    price: 45000000,
    category: 'electronics',
    subCategory: 'refrigerators',
    rating: 4.2,
    origin: 'Hàn Quốc',
    image: 'https://picsum.photos/seed/fridge/400/400',
    description: 'Một chiếc tủ lạnh thông minh với Family Hub và dung lượng lưu trữ khổng lồ.',
    stock: 5,
    isSuggested: true
  },
  // Fashion
  {
    id: 'f1',
    name: 'Áo sơ mi linen trắng cổ điển',
    price: 450000,
    category: 'fashion',
    subCategory: 'shirts',
    rating: 4.4,
    origin: 'Việt Nam',
    image: 'https://picsum.photos/seed/shirt/400/500',
    description: 'Thoáng khí, phong cách và hoàn hảo cho mùa hè.',
    stock: 150,
    isBestSelling: true
  },
  {
    id: 'f2',
    name: 'Quần Jeans Denim Slim Fit',
    price: 650000,
    category: 'fashion',
    subCategory: 'pants',
    rating: 4.3,
    origin: 'Ý',
    image: 'https://picsum.photos/seed/jeans/400/500',
    description: 'Denim chất lượng cao với hình bóng mỏng hoàn hảo.',
    stock: 80,
    isFavorite: true,
    isSuggested: true
  },
  {
    id: 'f3',
    name: 'Nike Air Max 270',
    price: 3600000,
    category: 'fashion',
    subCategory: 'shoes',
    rating: 4.8,
    origin: 'Mỹ',
    image: 'https://picsum.photos/seed/nike/500/500',
    description: 'Sự thoải mái và phong cách mang tính biểu tượng cho bước đi hàng ngày của bạn.',
    stock: 45,
    isBestSelling: true,
    isSuggested: true,
    brand: 'Nike',
    material: 'Da tổng hợp'
  },
  // Thêm mock đa dạng cho Books
  {
    id: 'b4',
    name: 'Sapiens: Lược sử loài người',
    price: 220000,
    category: 'books',
    subCategory: 'non-fiction',
    rating: 4.7,
    origin: 'Israel',
    image: 'https://picsum.photos/seed/sapiens/400/600',
    description: 'Một tác phẩm nổi bật về lịch sử nhân loại.',
    stock: 60,
    author: 'Yuval Noah Harari',
    language: 'Tiếng Việt'
  },
  {
    id: 'b5',
    name: 'Nhà giả kim',
    price: 90000,
    category: 'books',
    subCategory: 'novels',
    rating: 4.6,
    origin: 'Brazil',
    image: 'https://picsum.photos/seed/alchemist/400/600',
    description: 'Một câu chuyện truyền cảm hứng về hành trình theo đuổi ước mơ.',
    stock: 80,
    author: 'Paulo Coelho',
    language: 'Tiếng Việt'
  },
  // Electronics
  {
    id: 'e4',
    name: 'Samsung QLED TV 55"',
    price: 15900000,
    category: 'electronics',
    subCategory: 'televisions',
    rating: 4.4,
    origin: 'Hàn Quốc',
    image: 'https://picsum.photos/seed/tv/400/400',
    description: 'Màn hình QLED sắc nét, màu sắc sống động.',
    stock: 10,
    brand: 'Samsung',
    color: 'Đen'
  },
  {
    id: 'e5',
    name: 'Sony WH-1000XM5',
    price: 8900000,
    category: 'electronics',
    subCategory: 'headphones',
    rating: 4.9,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/sony/400/400',
    description: 'Tai nghe chống ồn hàng đầu thế giới.',
    stock: 25,
    brand: 'Sony',
    color: 'Trắng'
  },
  // Fashion
  {
    id: 'f4',
    name: 'Áo khoác gió Uniqlo',
    price: 990000,
    category: 'fashion',
    subCategory: 'jackets',
    rating: 4.5,
    origin: 'Nhật Bản',
    image: 'https://picsum.photos/seed/uniqlo/400/500',
    description: 'Chống nước, nhẹ, phù hợp mọi thời tiết.',
    stock: 70,
    brand: 'Uniqlo',
    material: 'Polyester'
  },
  {
    id: 'f5',
    name: 'Giày thể thao Adidas Superstar',
    price: 2100000,
    category: 'fashion',
    subCategory: 'shoes',
    rating: 4.6,
    origin: 'Đức',
    image: 'https://picsum.photos/seed/adidas/400/500',
    description: 'Biểu tượng thời trang đường phố.',
    stock: 30,
    brand: 'Adidas',
    material: 'Da thật'
  }
];

export const mockUsers: User[] = [
  { id: 'c1', name: 'Nguyễn Văn A', email: 'vana@example.com', role: 'customer' },
  { id: 's1', name: 'Alice Trần', email: 'alice@becshop.com', role: 'staff', staffCode: 'STF001', employmentType: 'Full-time' },
  { id: 's2', name: 'Bob Nguyễn', email: 'bob@becshop.com', role: 'staff', staffCode: 'STF002', employmentType: 'Part-time' },
  { id: 'a1', name: 'Admin Tổng', email: 'admin@becshop.com', role: 'admin' }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'c1',
    items: [
      { ...mockProducts[0], quantity: 1 }
    ],
    totalAmount: 850000,
    shippingFee: 30000,
    address: '123 Đường Chính, Hà Nội, Việt Nam',
    shippingMethod: 'standard',
    paymentMethod: 'COD',
    status: 'delivered',
    paymentStatus: 'paid',
    createdAt: '2024-03-10T10:00:00Z',
    region: 'North'
  },
  {
    id: 'ORD-002',
    customerId: 'c1',
    items: [
      { ...mockProducts[3], quantity: 1 }
    ],
    totalAmount: 32900000,
    shippingFee: 0,
    address: '456 Đường Phụ, TP. Hồ Chí Minh, Việt Nam',
    shippingMethod: 'express',
    paymentMethod: 'VNPay',
    status: 'awaiting_confirmation',
    paymentStatus: 'paid',
    createdAt: '2024-03-20T15:30:00Z',
    region: 'South'
  }
];
