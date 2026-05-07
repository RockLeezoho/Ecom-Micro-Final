import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { User, Product, CartItem, Order, type HomepageData } from './types';
import { fetchProducts, fetchCategories, fetchHomepageProducts, type Category } from './services/productService';
import { clearSession, getStoredSession, logoutUser, saveSession } from './services/authService';
import { addFavorite, listFavorites, removeFavorite } from './services/favoriteService';
import { addToCart, fetchCart, removeCartItems, updateCartItem } from './services/cartService';
import { confirmOrder as confirmOrderApi, createOrder, createShipment, handoverToCarrier, listOrders, rejectOrder as rejectOrderApi } from './services/orderService';
import { simulatePaymentSuccess } from './services/paymentService';
import { recommendProducts } from './services/aiService';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import InternalLayout from './components/layout/InternalLayout';

// Views
import HomeView from './components/views/HomeViewEnhanced';
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
import CustomerProfileView from './components/views/CustomerProfileView';
import CustomerAddressesView from './components/views/CustomerAddressesView';
import StaffOrderProcessView from './components/views/StaffOrderProcessView';
import StaffOrderSortView from './components/views/StaffOrderSortView';
import StaffLabelPrintView from './components/views/StaffLabelPrintView';
import StaffHandoverView from './components/views/StaffHandoverView';
import AdminProductListView from './components/views/AdminProductListView';
import AdminProductFormView from './components/views/AdminProductFormView';
import AdminStaffListView from './components/views/AdminStaffListView';
import AdminStaffFormView from './components/views/AdminStaffFormView';
import { ToastProvider } from './components/common/ToastProvider';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredSession()?.user || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [homepageLoading, setHomepageLoading] = useState(false);
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
      case 'PENDING':
      case 'AWAITING_CONFIRMATION':
      case 'awaiting_confirmation':
        return 'awaiting_confirmation';
      case 'PROCESSING':
      case 'AWAITING_PICKUP':
      case 'awaiting_pickup':
        return 'awaiting_pickup';
      case 'SHIPPED':
      case 'AWAITING_DELIVERY':
      case 'awaiting_delivery':
        return 'awaiting_delivery';
      case 'COMPLETED':
      case 'DELIVERED':
      case 'delivered':
        return 'delivered';
      case 'CANCELLED':
      case 'canceled':
        return 'canceled';
      default:
        return 'canceled';
    }
  };

  const mapShippingMethod = (method?: string): Order['shippingMethod'] =>
    String(method || '').toUpperCase() === 'EXPRESS' ? 'express' : 'standard';

  const mapPaymentMethod = (method?: string): Order['paymentMethod'] => {
    const normalized = String(method || '').toUpperCase();
    if (normalized === 'COD') return 'cod';
    if (normalized === 'BANK_TRANSFER') return 'bank_transfer';
    if (normalized === 'CREDIT_CARD') return 'credit_card';
    return 'e_wallet';
  };

  const syncCartFromService = async () => {
    if (!currentUser) {
      setCart([]);
      return;
    }
    try {
      const response = await fetchCart();
      const selectedMap = new Map(cart.map((item) => [item.id, !!item.selected]));
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
          selected: selectedMap.has(item.product_id) ? selectedMap.get(item.product_id) : true,
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
        paymentStatus: mapPaymentMethod(row.payment_method) === 'cod' ? 'unpaid' : 'paid',
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
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    // Parse query param from location.search directly for stable dependency
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'sach-luu-tru';
    
    // Validate tab against available categories (dynamic, no hardcoded values)
    const validSlugs = categories.map(c => c.slug);
    const categoryKey = validSlugs.includes(tab) ? tab : 'sach-luu-tru';

    console.log('[App] Homepage effect triggered', {
      location_search: location.search,
      raw_tab: params.get('tab'),
      parsed_tab: tab,
      validCategorySlugs: validSlugs,
      categoryKey,
      isValidTab: validSlugs.includes(tab),
      timestamp: new Date().toISOString(),
    });

    const loadHomepageData = async () => {
      setHomepageLoading(true);
      try {
        const data = await fetchHomepageProducts(categoryKey);
        let aiRecommended = data.recommended;
        try {
          const aiRes = await recommendProducts(
            currentUser?.id || "guest",
            [],
            [],
            `Goi y san pham cho danh muc ${categoryKey}`
          );
          if (Array.isArray(aiRes.products) && aiRes.products.length > 0) {
            aiRecommended = aiRes.products;
          }
        } catch {
          // fallback to product-service homepage recommendations
        }

        const mergedData = { ...data, recommended: aiRecommended };
        console.log('[App] Homepage data received', {
          categoryKey,
          new_arrivals: mergedData.new_arrivals.length,
          popular: mergedData.popular.length,
          recommended: mergedData.recommended.length,
          best_sellers: mergedData.best_sellers.length,
        });
        setHomepageData(mergedData);
      } catch (error) {
        console.error('[App] Failed to load homepage data', { categoryKey, error });
        setHomepageData(null);
      } finally {
        setHomepageLoading(false);
      }
    };

    loadHomepageData();
  }, [location.search, categories, currentUser?.id]);

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

  const toggleSelectAllItems = () => {
    setCart((prev) => {
      const allSelected = prev.length > 0 && prev.every((item) => item.selected);
      return prev.map((item) => ({ ...item, selected: !allSelected }));
    });
  };

  const selectSingleCartItem = (productId: string) => {
    setCart((prev) => prev.map((item) => ({ ...item, selected: item.id === productId })));
  };

  // Order Handlers
  const completePayment = async (details: any) => {
    if (!currentUser) {
      return;
    }
    if (!details.addressId && !details.address?.trim()) {
      return;
    }

    const paymentCode = String(details.paymentMethod || '').toLowerCase();
    const mappedPaymentMethod: 'COD' | 'BANK_TRANSFER' | 'E_WALLET' | 'CREDIT_CARD' =
      paymentCode === 'cod'
        ? 'COD'
        : paymentCode === 'bank'
          ? 'BANK_TRANSFER'
          : paymentCode === 'credit_card'
            ? 'CREDIT_CARD'
            : 'E_WALLET';

    const selectedCartItems = cart.filter((i) => i.selected);
    const items = selectedCartItems
      .map((item) => ({ product_id: item.id, quantity: item.quantity, price: item.price }));
    const orderResp = await createOrder({
      address_id: details.addressId || undefined,
      address_text: details.addressId ? undefined : String(details.address || '').trim(),
      payment_method: mappedPaymentMethod,
      shipping_method: details.shippingMethod === 'express' ? 'EXPRESS' : 'STANDARD',
      items,
    });
    if (orderResp?.payment?.payment_url) {
      const q = new URLSearchParams({
        order_id: String(orderResp.order_id),
        payment_id: String(orderResp.payment.payment_id || ''),
        reference_number: String(orderResp.payment.reference_number || ''),
        payment_url: String(orderResp.payment.payment_url || ''),
      });
      navigate(`/payment?${q.toString()}`);
      return;
    }
    if (selectedCartItems.length > 0) {
      await removeCartItems(selectedCartItems.map((item) => item.id));
    }
    await syncOrdersFromService();
    await syncCartFromService();
    navigate('/orders');
  };

  const confirmOrder = async (orderId: string, allowed: boolean) => {
    if (!allowed) {
      await rejectOrderApi(orderId, 'Staff rejected from portal');
      await syncOrdersFromService();
      return;
    }
    await confirmOrderApi(orderId, 'Staff confirmed from portal');
    await syncOrdersFromService();
  };

  const consolidateOrders = (ids: string[]) => {
    alert(`Các đơn hàng ${ids.join(', ')} đã được gộp để vận chuyển.`);
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: 'awaiting_pickup' } : o));
    navigate('/portal/logistics');
  };

  const updateOrderLogistics = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const createShipmentForOrder = async (orderId: string) => {
    await createShipment(orderId, { weight: 1, length: 20, width: 20, height: 10 });
    await syncOrdersFromService();
    navigate(`/portal/label/${orderId}`);
  };

  const handoverOrder = async (orderId: string, carrierName: string) => {
    await handoverToCarrier(orderId, carrierName || 'Unknown');
    await syncOrdersFromService();
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
    <ToastProvider>
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <HomeView 
            products={products} 
            homepageData={homepageData}
            homepageLoading={homepageLoading}
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={async (p) => {
              await handleAddToCart(p);
              setCart(prev => prev.map(item => ({ ...item, selected: item.id === p.id })));
              navigate('/checkout');
            }}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
          />
        </CustomerLayout>
      } />
      <Route path="/products/:id" element={
        <ProductDetailViewWrapper 
          products={products} 
          handleAddToCart={handleAddToCart} 
          selectSingleCartItem={selectSingleCartItem}
          currentUser={currentUser} 
          cart={cart} 
          handleLogout={handleLogout} 
        />
      } />
      <Route path="/cart" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CartView 
            items={cart} 
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
            onToggleSelect={toggleSelectItem}
            onToggleSelectAll={toggleSelectAllItems}
            onCheckout={() => navigate('/checkout')}
            onNavigate={(v: any) => navigate(v.type === 'HOME' ? '/' : '/cart')}
          />
        </CustomerLayout>
      } />
      <Route path="/checkout" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CheckoutView 
            selectedItems={cart.filter(i => i.selected)} 
            onCompletePayment={completePayment} 
            currentUser={currentUser}
            onNavigate={(v: any) => navigate(v.type === 'CART' ? '/cart' : '/')} 
          />
        </CustomerLayout>
      } />
      <Route path="/payment" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <PaymentPage onDone={async () => {
            const selectedIds = cart.filter((item) => item.selected).map((item) => item.id);
            if (selectedIds.length > 0) {
              await removeCartItems(selectedIds).catch(() => undefined);
            }
            await syncOrdersFromService();
            await syncCartFromService();
            navigate('/orders');
          }} />
        </CustomerLayout>
      } />
      <Route path="/orders" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
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
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <NewsView />
        </CustomerLayout>
      } />
      <Route path="/contact" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <ContactView />
        </CustomerLayout>
      } />
      <Route path="/account/profile" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CustomerProfileView currentUser={currentUser} onUserUpdated={(user) => setCurrentUser(user)} />
        </CustomerLayout>
      } />
      <Route path="/account/addresses" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CustomerAddressesView currentUser={currentUser} />
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
                  onNavigateToLabel={(o) => createShipmentForOrder(o.id)}
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
      <Route path="/portal/handover" element={<StaffHandoverWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} onHandover={handoverOrder} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ToastProvider>
  );
}

// Wrappers to handle params logic within App.tsx context
function ProductDetailViewWrapper({ products, handleAddToCart, selectSingleCartItem, currentUser, cart, handleLogout }: any) {
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
        onBuyNow={async (p, q) => {
          await handleAddToCart(p, q);
          selectSingleCartItem(p.id);
          navigate('/checkout');
        }}
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

function StaffHandoverWrapper({ orders, currentUser, onLogout, onHandover }: any) {
  const navigate = useNavigate();
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <StaffHandoverView orders={orders} onBack={() => navigate('/portal/logistics')} onHandover={onHandover} />
    </InternalLayout>
  );
}

function PaymentPage({ onDone }: { onDone: () => Promise<void> }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get('payment_id') || '';
  const referenceNumber = params.get('reference_number') || '';
  const paymentUrl = params.get('payment_url') || '';
  const [submitting, setSubmitting] = useState(false);
  const qrImage = paymentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentUrl)}`
    : '';

  const handleSimulate = async () => {
    setSubmitting(true);
    try {
      await simulatePaymentSuccess({ payment_id: paymentId || undefined, reference_number: referenceNumber || undefined });
      await onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border p-6 mt-8">
      <h1 className="text-xl font-bold mb-3">Thanh toán đơn hàng</h1>
      <p className="text-sm text-gray-500 mb-4">Quét QR/đi tới cổng thanh toán, sau đó bấm giả lập đã chuyển khoản thành công.</p>
      {qrImage ? (
        <div className="mb-4 flex justify-center">
          <img src={qrImage} alt="QR thanh toan" className="h-56 w-56 rounded-xl border p-2 bg-white" />
        </div>
      ) : null}
      <div className="bg-gray-100 rounded-xl p-4 text-xs break-all mb-4">{paymentUrl || 'Khong co payment URL'}</div>
      <div className="flex gap-3">
        <button onClick={() => window.open(paymentUrl, '_blank')} className="px-4 py-2 rounded-lg border text-sm font-semibold">
          Mo cong thanh toan
        </button>
        <button
          onClick={handleSimulate}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? 'Dang xu ly...' : 'Gia lap da chuyen khoan thanh cong'}
        </button>
        <button onClick={() => navigate('/orders')} className="px-4 py-2 rounded-lg border text-sm font-semibold">
          Ve don hang
        </button>
      </div>
    </div>
  );
}
