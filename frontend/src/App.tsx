import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { User, Product, CartItem, Order } from './types';
import { fetchProducts } from './services/productService';
import { clearSession, getStoredSession, logoutUser, saveSession } from './services/authService';
import { addFavorite, listFavorites, removeFavorite } from './services/favoriteService';
import { addToCart, fetchCart, removeCartItems, updateCartItem } from './services/cartService';
import { createOrder, listOrders } from './services/orderService';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import InternalLayout from './components/layout/InternalLayout';

// Views
import HomeView from './components/views/HomeView';
import NewsView from './components/views/NewsView';
import ContactView from './components/views/ContactView';
import LoginView from './components/views/LoginView';
import RegisterView from './components/views/RegisterView';
import CartView from './components/views/CartView';
import CheckoutView from './components/views/CheckoutView';
import OrderHistoryView from './components/views/OrderHistoryView';
import OrderDetailsView from './components/views/OrderDetailsView';
import ProductDetailView from './components/views/ProductDetailView';
import ReviewView from './components/views/ReviewView';
import StaffOrderProcessView from './components/views/StaffOrderProcessView';
import StaffOrderSortView from './components/views/StaffOrderSortView';
import StaffLabelPrintView from './components/views/StaffLabelPrintView';
import StaffHandoverView from './components/views/StaffHandoverView';
import AdminProductListView from './components/views/AdminProductListView';
import AdminProductFormView from './components/views/AdminProductFormView';
import AdminStaffListView from './components/views/AdminStaffListView';
import AdminStaffFormView from './components/views/AdminStaffFormView';

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredSession()?.user || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    // Favorite Handlers
    const toggleFavorite = async (productId: string) => {
      const existed = favoriteIds.includes(productId);
      setFavoriteIds((prev) => (existed ? prev.filter((id) => id !== productId) : [...prev, productId]));
      try {
        if (existed) {
          await removeFavorite(productId);
        } else {
          await addFavorite(productId);
        }
      } catch {
        setFavoriteIds((prev) => (existed ? [...prev, productId] : prev.filter((id) => id !== productId)));
      }
    };
  const [staffList, setStaffList] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const mapOrderStatus = (status?: string): Order['status'] => {
    switch (status) {
      case 'AWAITING_CONFIRMATION':
      case 'awaiting_confirmation':
        return 'awaiting_confirmation';
      case 'AWAITING_PICKUP':
      case 'awaiting_pickup':
        return 'awaiting_pickup';
      case 'AWAITING_DELIVERY':
      case 'awaiting_delivery':
        return 'awaiting_delivery';
      case 'DELIVERED':
      case 'delivered':
        return 'delivered';
      default:
        return 'canceled';
    }
  };

  const mapShippingMethod = (method?: string): Order['shippingMethod'] =>
    String(method || '').toUpperCase() === 'EXPRESS' ? 'express' : 'standard';

  const mapPaymentMethod = (method?: string): Order['paymentMethod'] => {
    const normalized = String(method || '').toUpperCase();
    if (normalized === 'COD') return 'COD';
    if (normalized === 'E_WALLET') return 'MOMO';
    if (normalized === 'CREDIT_CARD') return 'VNPay';
    return 'ZaloPay';
  };

  const syncCartFromService = async () => {
    if (!currentUser) {
      setCart([]);
      return;
    }
    try {
      const response = await fetchCart();
      const mapped = (response.items || []).map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return {
          ...(product || {
            id: item.product_id,
            name: 'San pham',
            price: Number(item.sales_price || 0),
            category: 'books' as const,
            subCategory: 'general',
            rating: 0,
            origin: 'N/A',
            image: `https://picsum.photos/seed/${item.product_id}/400/400`,
            description: '',
            stock: 0,
          }),
          id: item.product_id,
          price: Number(item.sales_price || product?.price || 0),
          quantity: item.quantity,
          selected: true,
        } as CartItem;
      });
      setCart(mapped);
    } catch {
      setCart([]);
    }
  };

  const syncOrdersFromService = async () => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    try {
      const data = await listOrders();
      const mapped: Order[] = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: String(row.id),
        customerId: currentUser.id,
        items: [],
        totalAmount: Number(row.total_price || 0),
        shippingFee: Number(row.shipping_fee || 0),
        address: '',
        shippingMethod: mapShippingMethod(row.shipping_method),
        paymentMethod: mapPaymentMethod(row.payment_method),
        status: mapOrderStatus(row.status),
        paymentStatus: mapPaymentMethod(row.payment_method) === 'COD' ? 'unpaid' : 'paid',
        createdAt: row.created_at || new Date().toISOString(),
      }));
      setOrders(mapped);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch {
        setProducts([]);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setFavoriteIds([]);
      return;
    }
    const loadFavorites = async () => {
      try {
        const ids = await listFavorites();
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds([]);
      }
    };
    loadFavorites();
  }, [currentUser]);

  useEffect(() => {
    syncCartFromService();
    syncOrdersFromService();
  }, [currentUser, products]);

  // Auth Handlers
  const handleLogin = (session: { user?: User; customer?: User; access: string; refresh: string }) => {
    const user = session.user ?? session.customer;
    if (!user) {
      return;
    }

    const normalizedSession = { ...session, user } as { user: User; access: string; refresh: string };
    saveSession(normalizedSession);
    setCurrentUser(user);
    if (user.role === 'customer') {
      navigate('/');
    } else {
      navigate('/portal/orders');
    }
  };

  const handleLogout = async () => {
    await logoutUser().catch(() => undefined);
    clearSession();
    setCurrentUser(null);
    setCart([]);
    navigate('/');
  };

  // Cart Handlers
  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { ...product, quantity, selected: true }];
      });
      return;
    }
    await addToCart(product.id, product.price, quantity);
    await syncCartFromService();
  };

  const updateQuantity = async (id: string, delta: number) => {
    if (!currentUser) {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      ));
      return;
    }
    const current = cart.find((item) => item.id === id);
    const next = Math.max(1, (current?.quantity || 1) + delta);
    await updateCartItem(id, next);
    await syncCartFromService();
  };

  const removeItem = async (id: string) => {
    if (!currentUser) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    await removeCartItems([id]);
    await syncCartFromService();
  };

  const toggleSelectItem = (id: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  // Order Handlers
  const completePayment = async (details: any) => {
    if (!currentUser) {
      return;
    }
    if (!details.addressId) {
      return;
    }
    const items = cart
      .filter((i) => i.selected)
      .map((item) => ({ product_id: item.id, quantity: item.quantity, price: item.price }));
    await createOrder({
      address_id: details.addressId,
      payment_method: details.paymentMethod === 'COD' ? 'COD' : 'E_WALLET',
      shipping_method: details.shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD',
      items,
    });
    await syncOrdersFromService();
    await syncCartFromService();
    navigate('/orders');
  };

  const confirmOrder = (orderId: string, allowed: boolean) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: allowed ? 'awaiting_pickup' : 'canceled' } : o
    ));
  };

  const consolidateOrders = (ids: string[]) => {
    alert(`Các đơn hàng ${ids.join(', ')} đã được gộp để vận chuyển.`);
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'awaiting_pickup' } : o));
    navigate('/portal/logistics');
  };

  const updateOrderLogistics = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  // Admin Handlers
  const saveProduct = (product: Partial<Product>) => {
    if (product.id) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...product } as Product : p));
    } else {
      const newProduct = { ...product, id: `p${Date.now()}` } as Product;
      setProducts([newProduct, ...products]);
    }
    navigate('/portal/admin/products');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const saveStaff = (staff: Partial<User>) => {
    if (staff.id) {
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, ...staff } as User : s));
    } else {
      const newStaff = { ...staff, id: `u${Date.now()}` } as User;
      setStaffList([newStaff, ...staffList]);
    }
    navigate('/portal/admin/staff');
  };

  const deleteStaff = (id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <HomeView 
            products={products} 
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={(p) => { handleAddToCart(p); navigate('/cart'); }}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
          />
        </CustomerLayout>
      } />
      <Route path="/products/:id" element={
        <ProductDetailViewWrapper 
          products={products} 
          handleAddToCart={handleAddToCart} 
          currentUser={currentUser} 
          cart={cart} 
          handleLogout={handleLogout} 
        />
      } />
      <Route path="/cart" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <CartView 
            items={cart} 
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
            onToggleSelect={toggleSelectItem}
            onCheckout={() => navigate('/checkout')}
            onNavigate={(v: any) => navigate(v.type === 'HOME' ? '/' : '/cart')}
          />
        </CustomerLayout>
      } />
      <Route path="/checkout" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <CheckoutView 
            selectedItems={cart.filter(i => i.selected)} 
            onCompletePayment={completePayment} 
            currentUser={currentUser}
            onNavigate={(v: any) => navigate(v.type === 'CART' ? '/cart' : '/')} 
          />
        </CustomerLayout>
      } />
      <Route path="/orders" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <OrderHistoryView 
            orders={orders.filter(o => o.customerId === currentUser?.id)} 
            onViewDetails={(o) => navigate(`/orders/${o.id}`)}
            onNavigate={(v: any) => navigate(v.type === 'HOME' ? '/' : '/orders')}
          />
        </CustomerLayout>
      } />
      <Route path="/orders/:id" element={
        <OrderDetailsViewWrapper 
          orders={orders} 
          products={products} 
          currentUser={currentUser} 
          cart={cart} 
          handleLogout={handleLogout} 
        />
      } />
      <Route path="/review/:productId" element={
        <ReviewViewWrapper 
          products={products} 
          currentUser={currentUser} 
          cart={cart} 
          handleLogout={handleLogout} 
        />
      } />
      <Route path="/news" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <NewsView />
        </CustomerLayout>
      } />
      <Route path="/contact" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
          <ContactView />
        </CustomerLayout>
      } />
      <Route path="/login" element={<LoginView onLogin={handleLogin} onNavigate={(v: any) => navigate(v.type === 'REGISTER' ? '/register' : '/')} />} />
      <Route path="/register" element={<RegisterView onRegister={handleLogin} onNavigate={() => navigate('/login')} />} />

      {/* Internal Portal Routes */}
      <Route path="/portal/login" element={<Navigate to="/portal/staff/login" replace />} />
      <Route path="/portal/staff/login" element={<LoginView onLogin={handleLogin} onNavigate={() => navigate('/login')} roleType="staff" />} />
      <Route path="/portal/admin/login" element={<LoginView onLogin={handleLogin} onNavigate={() => navigate('/login')} roleType="admin" />} />
      
      <Route path="/portal/*" element={
        currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin') ? (
          <InternalLayout currentUser={currentUser} onLogout={handleLogout}>
            <Routes>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={
                <StaffOrderProcessView 
                  orders={orders.filter(o => o.status === 'awaiting_confirmation' || o.status === 'canceled')} 
                  onConfirm={confirmOrder}
                  onConsolidate={consolidateOrders}
                />
              } />
              <Route path="logistics" element={
                <StaffOrderSortView 
                  orders={orders.filter(o => o.status === 'awaiting_pickup' || o.status === 'awaiting_delivery')} 
                  onUpdateOrder={updateOrderLogistics}
                  onNavigateToLabel={(o) => navigate(`/portal/label/${o.id}`)}
                  onNavigateToHandover={() => navigate('/portal/handover')}
                />
              } />
              <Route path="admin/products" element={
                <AdminProductListView 
                  products={products} 
                  onAdd={() => navigate('/portal/admin/products/new')}
                  onEdit={(p) => navigate(`/portal/admin/products/${p.id}`)}
                  onDelete={deleteProduct}
                />
              } />
              <Route path="admin/products/new" element={<AdminProductFormView product={undefined} onSave={saveProduct} onCancel={() => navigate('/portal/admin/products')} />} />
              <Route path="admin/products/:id" element={<AdminProductFormWrapper products={products} onSave={saveProduct} onCancel={() => navigate('/portal/admin/products')} />} />
              <Route path="admin/staff" element={
                <AdminStaffListView 
                  staffList={staffList} 
                  onAdd={() => navigate('/portal/admin/staff/new')}
                  onEdit={(s) => navigate(`/portal/admin/staff/${s.id}`)}
                  onDelete={deleteStaff}
                />
              } />
              <Route path="admin/staff/new" element={<AdminStaffFormView staff={undefined} onSave={saveStaff} onCancel={() => navigate('/portal/admin/staff')} />} />
              <Route path="admin/staff/:id" element={<AdminStaffFormWrapper staffList={staffList} onSave={saveStaff} onCancel={() => navigate('/portal/admin/staff')} />} />
            </Routes>
          </InternalLayout>
        ) : (
          <Navigate to="/portal/staff/login" replace />
        )
      } />

      {/* Auxiliary Internal Routes (Label, etc) */}
      <Route path="/portal/label/:id" element={<StaffLabelPrintWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} />} />
      <Route path="/portal/handover" element={<StaffHandoverWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Wrappers to handle params logic within App.tsx context
function ProductDetailViewWrapper({ products, handleAddToCart, currentUser, cart, handleLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === id);
  if (!product) return <Navigate to="/" replace />;
  return (
    <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
      <ProductDetailView 
        product={product} 
        onBack={() => navigate('/')}
        onAddToCart={handleAddToCart}
        onBuyNow={(p, q) => { handleAddToCart(p, q); navigate('/cart'); }}
        relatedProducts={products.filter((p: any) => p.category === product.category && p.id !== product.id)}
      />
    </CustomerLayout>
  );
}

function OrderDetailsViewWrapper({ orders, products, currentUser, cart, handleLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o: any) => o.id === id);
  if (!order) return <Navigate to="/orders" replace />;
  return (
    <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
      <OrderDetailsView 
        order={order} 
        onBack={() => navigate('/orders')} 
        onReview={(pid) => navigate(`/review/${pid}`)} 
      />
    </CustomerLayout>
  );
}

function ReviewViewWrapper({ products, currentUser, cart, handleLogout }: any) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === productId);
  if (!product) return <Navigate to="/orders" replace />;
  return (
    <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
      <ReviewView product={product} onBack={() => navigate('/orders')} onSubmit={() => navigate('/orders')} />
    </CustomerLayout>
  );
}

function AdminProductFormWrapper({ products, onSave, onCancel }: any) {
  const { id } = useParams();
  const product = products.find((p: any) => p.id === id);
  return <AdminProductFormView product={product} onSave={onSave} onCancel={onCancel} />;
}

function AdminStaffFormWrapper({ staffList, onSave, onCancel }: any) {
  const { id } = useParams();
  const staff = staffList.find((s: any) => s.id === id);
  return <AdminStaffFormView staff={staff} onSave={onSave} onCancel={onCancel} />;
}

function StaffLabelPrintWrapper({ orders, currentUser, onLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o: any) => o.id === id);
  if (!order) return <Navigate to="/portal/logistics" replace />;
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <StaffLabelPrintView order={order} onBack={() => navigate('/portal/logistics')} />
    </InternalLayout>
  );
}

function StaffHandoverWrapper({ orders, currentUser, onLogout }: any) {
  const navigate = useNavigate();
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <StaffHandoverView orders={orders} onBack={() => navigate('/portal/logistics')} />
    </InternalLayout>
  );
}
