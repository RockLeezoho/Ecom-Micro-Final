import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { User, Product, CartItem, Order, type HomepageData } from './types';
import { fetchProducts, fetchCategories, fetchHomepageProducts, type Category } from './services/productService';
import { clearSession, getAutoLogoutDelayMs, getStoredSession, logoutUser, saveSession } from './services/authService';
import { addFavorite, listFavorites, removeFavorite } from './services/favoriteService';
import { addToCart, fetchCart, removeCartItems, updateCartItem } from './services/cartService';
import { confirmOrder as confirmOrderApi, createOrder, createShipment, handoverToCarrier, listOrders, rejectOrder as rejectOrderApi } from './services/orderService';
import { confirmBankTransfer, getPaymentQr } from './services/paymentService';
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
import FavoriteView from './components/views/FavoriteView';
import CategoryProductListView from './components/views/CategoryProductListView';
import CheckoutView from './components/views/CheckoutView';
import OrderHistoryView from './components/views/OrderHistoryView';
import OrderDetailsView from './components/views/OrderDetailsView';
import ProductDetailView from './components/views/ProductDetailView';
import ReviewView from './components/views/ReviewView';
import CustomerProfileView from './components/views/CustomerProfileView';
import CustomerAddressesView from './components/views/CustomerAddressesView';
import StaffPortalHomeView from './components/views/StaffPortalHomeView';
import AdminPortalHomeView from './components/views/AdminPortalHomeView';
import StaffOrderProcessView from './components/views/StaffOrderProcessView';
import StaffOrderSortView from './components/views/StaffOrderSortView';
import StaffLabelPrintView from './components/views/StaffLabelPrintView';
import StaffHandoverView from './components/views/StaffHandoverView';
import AdminProductListView from './components/views/AdminProductListView';
import AdminProductFormView from './components/views/AdminProductFormView';
import AdminStaffListView from './components/views/AdminStaffListView';
import AdminStaffFormView from './components/views/AdminStaffFormView';
import AdminCustomerListView from './components/views/AdminCustomerListView';
import AdminCustomerFormView from './components/views/AdminCustomerFormView';
import AddToCartModal from './components/common/AddToCartModal';
import { ToastProvider } from './components/common/ToastProvider';
import { useToast } from './components/common/toastHook';
import { getAuthExpiredEventName } from './services/authInterceptor';
import { fetchStaffList, fetchCustomerList, createStaff, updateStaff, deleteStaff as deleteStaffApi, createCustomer, updateCustomer, deleteCustomer as deleteCustomerApi } from './services/userService';
import { createAdminProduct, updateAdminProduct, deleteAdminProduct } from './services/adminProductService';

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const autoLogoutTimerRef = useRef<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredSession()?.user || null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [homepageLoading, setHomepageLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const allProducts = React.useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    if (homepageData) {
      [...(homepageData.new_arrivals || []),
      ...(homepageData.recommended || []),
      ...(homepageData.best_sellers || []),
      ...(homepageData.popular || [])].forEach(p => map.set(p.id, p));
    }
    return Array.from(map.values());
  }, [products, homepageData]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        if (currentUser) {
          const { validateSession } = await import('./services/authService');
          const isValid = await validateSession();
          if (!isValid) {
            const { clearSession } = await import('./services/authService');
            clearSession();
            setCurrentUser(null);
            setCart([]);
          }
        }
      } catch {
        // If validation completely fails, let individual requests handle 401s
      } finally {
        setIsCheckingSession(false);
      }
    };
    verifySession();
  }, [currentUser]);

  // Favorite Handlers
  const toggleFavorite = async (productId: string) => {
    const existed = favoriteIds.includes(productId);
    setFavoriteIds((prev) => (existed ? prev.filter((id) => id !== productId) : [...prev, productId]));
    try {
      if (existed) {
        await removeFavorite(productId);
        showToast({ tone: 'info', title: 'Đã bỏ yêu thích' });
      } else {
        await addFavorite(productId);
        showToast({ tone: 'success', title: 'Đã thêm vào mục yêu thích' });
      }
    } catch {
      setFavoriteIds((prev) => (existed ? [...prev, productId] : prev.filter((id) => id !== productId)));
      showToast({ tone: 'error', title: 'Lỗi khi cập nhật yêu thích' });
    }
  };
  const [staffList, setStaffList] = useState<User[]>([]);
  const [customerList, setCustomerList] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [staffPortalRefreshVersion, setStaffPortalRefreshVersion] = useState(0);
  const [adminPortalRefreshVersion, setAdminPortalRefreshVersion] = useState(0);
  
  const [cartModal, setCartModal] = useState<{
    isOpen: boolean;
    product: Product | null;
    quantity: number;
    actionType: 'cart' | 'buy';
  }>({ isOpen: false, product: null, quantity: 1, actionType: 'cart' });

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

  const clearAutoLogoutTimer = () => {
    if (autoLogoutTimerRef.current !== null) {
      window.clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = (accessToken?: string) => {
    clearAutoLogoutTimer();
    if (!accessToken) return;

    const delayMs = getAutoLogoutDelayMs(accessToken, 30000);
    autoLogoutTimerRef.current = window.setTimeout(() => {
      void handleLogout();
    }, delayMs);
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
        customerId: String(row.user_id || currentUser.id),
        customerName:
          String(row.customer_name || '').trim() ||
          `KH-${String(row.user_id || currentUser.id).slice(0, 8)}`,
        itemCount: Number(row.item_count || 0),
        items: [],
        totalAmount: Number(row.total_price || 0),
        shippingFee: Number(row.shipping_fee || 0),
        address: '',
        shippingMethod: mapShippingMethod(row.shipping_method),
        paymentMethod: mapPaymentMethod(row.payment_method),
        status: mapOrderStatus(row.status),
        paymentStatus: row.is_paid ? 'paid' : 'unpaid',
        createdAt: row.created_at || new Date().toISOString(),
        carrier: row.carrier ? String(row.carrier) : undefined,
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
    if (!currentUser || currentUser.role !== 'admin') {
      setStaffList([]);
      setCustomerList([]);
      return;
    }

    const loadManagementLists = async () => {
      try {
        const [staff, customers] = await Promise.all([fetchStaffList(), fetchCustomerList()]);
        setStaffList(staff);
        setCustomerList(customers);
      } catch {
        setStaffList([]);
        setCustomerList([]);
      }
    };

    loadManagementLists();
  }, [currentUser?.role]);

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

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
            `Goi y san pham cho danh muc ${categoryKey}`,
            categoryKey
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
    scheduleAutoLogout(normalizedSession.access);
    if (user.role === 'customer') {
      navigate('/');
    } else if (user.role === 'admin') {
      navigate('/portal/admin');
    } else {
      navigate('/portal/staff');
    }
  };

  const handleLogout = async () => {
    clearAutoLogoutTimer();
    await logoutUser().catch(() => undefined);
    clearSession();
    setCurrentUser(null);
    setCart([]);
    navigate('/');
  };

  useEffect(() => {
    const onAuthExpired = () => {
      if (getStoredSession()) {
        void handleLogout();
      }
    };

    const eventName = getAuthExpiredEventName();
    window.addEventListener(eventName, onAuthExpired);
    return () => window.removeEventListener(eventName, onAuthExpired);
  }, [handleLogout]);

  useEffect(() => {
    const session = getStoredSession();
    if (currentUser && session?.access) {
      scheduleAutoLogout(session.access);
    } else {
      clearAutoLogoutTimer();
    }

    return clearAutoLogoutTimer;
  }, [currentUser]);

  // Cart Handlers
  const handleBuyNow = async (product: Product, quantity: number = 1, options?: any) => {
    const category = String(product.category || '').toLowerCase();
    const needsVariant = category.includes('thoi-trang') || category.includes('fashion') || category.includes('dien-tu') || category.includes('electronic');

    if (needsVariant && !options) {
      setCartModal({ isOpen: true, product, quantity, actionType: 'buy' });
      return;
    }

    if (!currentUser) {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity, selected: true } : { ...item, selected: false });
        }
        return [...prev.map(item => ({ ...item, selected: false })), { ...product, quantity, selected: true }];
      });
      navigate('/checkout');
      return;
    }
    await addToCart(product.id, product.price, quantity);
    await syncCartFromService();
    selectSingleCartItem(product.id);
    navigate('/checkout');
  };

  const handleAddToCart = async (product: Product, quantity: number = 1, options?: any) => {
    const category = String(product.category || '').toLowerCase();
    const needsVariant = category.includes('thoi-trang') || category.includes('fashion') || category.includes('dien-tu') || category.includes('electronic');

    if (needsVariant && !options) {
      setCartModal({ isOpen: true, product, quantity, actionType: 'cart' });
      return;
    }

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

  const removePurchasedItems = async (productIds: string[]) => {
    const ids = Array.from(new Set(productIds.filter((id) => Boolean(id))));
    if (ids.length === 0) {
      return;
    }
    try {
      await removeCartItems(ids);
    } finally {
      await syncCartFromService();
    }
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
    const mappedPaymentMethod: 'COD' | 'BANK_TRANSFER' =
      paymentCode === 'cod' ? 'COD' : 'BANK_TRANSFER';

    const selectedCartItems = cart.filter((i) => i.selected);
    const items = selectedCartItems
      .map((item) => ({ product_id: item.id, quantity: item.quantity, price: item.price }));
    const orderedProductIds = selectedCartItems.map((item) => item.id);
    const orderResp = await createOrder({
      address_id: details.addressId || undefined,
      address_text: String(details.addressText || details.address || '').trim() || undefined,
      recipient_name: String(currentUser.name || currentUser.username || '').trim() || undefined,
      recipient_phone: String(currentUser.phoneNumber || '').trim() || undefined,
      payment_method: mappedPaymentMethod,
      shipping_method: 'STANDARD',
      shipping_fee: Number(details.shippingFee || 0),
      carrier_name: String(details.carrierName || '').trim(),
      items,
    });

    if (mappedPaymentMethod === 'COD') {
      await removePurchasedItems(orderedProductIds);
      await syncOrdersFromService();
      showToast({
        tone: 'success',
        title: 'Đặt hàng thành công',
        description: 'Đơn hàng đang chờ xác nhận và sẽ thanh toán khi nhận hàng.',
      });
      navigate('/orders');
      return;
    }

    if (orderResp?.payment?.payment_url) {
      const q = new URLSearchParams({
        order_id: String(orderResp.order_id),
        payment_id: String(orderResp.payment.payment_id || ''),
        reference_number: String(orderResp.payment.reference_number || ''),
        payment_url: String(orderResp.payment.payment_url || ''),
        item_ids: orderedProductIds.join(','),
      });
      navigate(`/payment?${q.toString()}`);
      return;
    }

    await removePurchasedItems(orderedProductIds);
    await syncOrdersFromService();
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
    navigate('/portal/staff/logistics');
  };

  const updateOrderLogistics = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const createShipmentForOrder = async (orderId: string) => {
    await createShipment(orderId, { weight: 1, length: 20, width: 20, height: 10 });
    await syncOrdersFromService();
    navigate(`/portal/staff/label/${orderId}`);
  };

  const handoverOrder = async (orderId: string, carrierName: string) => {
    await handoverToCarrier(orderId, carrierName || 'Unknown');
    await syncOrdersFromService();
  };

  // Management Handlers
  const saveProduct = async (product: Partial<Product>) => {
    const resolvedCategoryId =
      product.categoryId || categories.find((category) => category.slug === product.category)?.id || product.category;
    const payload = { ...product, categoryId: resolvedCategoryId };

    if (product.id) {
      await updateAdminProduct(product.id, payload);
    } else {
      await createAdminProduct(payload);
    }
    setProducts(await fetchProducts().catch(() => products));
    setStaffPortalRefreshVersion((value) => value + 1);
    navigate('/portal/staff/products');
  };

  const deleteProduct = async (id: string) => {
    await deleteAdminProduct(id);
    setProducts(await fetchProducts().catch(() => products));
    setStaffPortalRefreshVersion((value) => value + 1);
  };

  const saveStaff = async (staff: Partial<User> & { password?: string }) => {
    const payload = {
      username: String(staff.username || ''),
      email: String(staff.email || ''),
      phone_number: String(staff.phoneNumber || ''),
      first_name: staff.firstName || undefined,
      last_name: staff.lastName || undefined,
      employment_type: staff.employmentType || 'Full-time',
      is_active: staff.isActive ?? true,
      ...(staff.password ? { password: String(staff.password) } : {}),
    };

    if (staff.id) {
      await updateStaff(staff.id, payload);
    } else {
      await createStaff(payload as any);
    }

    setStaffList(await fetchStaffList().catch(() => staffList));
    setAdminPortalRefreshVersion((value) => value + 1);
    navigate('/portal/admin/staff');
  };

  const deleteStaff = async (id: string) => {
    await deleteStaffApi(id);
    setStaffList(await fetchStaffList().catch(() => staffList));
    setAdminPortalRefreshVersion((value) => value + 1);
  };

  const saveCustomer = async (customer: Partial<User> & { password?: string }) => {
    const payload = {
      username: String(customer.username || ''),
      email: String(customer.email || ''),
      phone_number: String(customer.phoneNumber || ''),
      first_name: customer.firstName || undefined,
      last_name: customer.lastName || undefined,
      height: customer.height ?? null,
      weight: customer.weight ?? null,
      foot_length: customer.footLength ?? null,
      is_active: customer.isActive ?? true,
      ...(customer.password ? { password: String(customer.password) } : {}),
    };

    if (customer.id) {
      await updateCustomer(customer.id, payload);
    } else {
      await createCustomer(payload as any);
    }

    setCustomerList(await fetchCustomerList().catch(() => customerList));
    setAdminPortalRefreshVersion((value) => value + 1);
    navigate('/portal/admin/customers');
  };

  const deleteCustomer = async (id: string) => {
    await deleteCustomerApi(id);
    setCustomerList(await fetchCustomerList().catch(() => customerList));
    setAdminPortalRefreshVersion((value) => value + 1);
  };

  return (
    <>
      {/* Loading Overlay */}
      {isCheckingSession && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium tracking-wide">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      )}

      <AddToCartModal
        isOpen={cartModal.isOpen}
        product={cartModal.product}
        quantity={cartModal.quantity}
        actionType={cartModal.actionType}
        onClose={() => setCartModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(product, quantity, options) => {
          setCartModal(prev => ({ ...prev, isOpen: false }));
          if (cartModal.actionType === 'cart') {
            handleAddToCart(product, quantity, options);
          } else {
            handleBuyNow(product, quantity, options);
          }
        }}
      />

    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <HomeView
            products={products}
            homepageData={homepageData}
            homepageLoading={homepageLoading}
            categories={categories}
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={(p) => handleBuyNow(p)}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
          />
        </CustomerLayout>
      } />
      <Route path="/category/:categoryId" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CategoryProductListView
            products={allProducts}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={(p) => handleBuyNow(p)}
          />
        </CustomerLayout>
      } />
      <Route path="/category/:categoryId/:subCategoryId" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <CategoryProductListView
            products={allProducts}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={(p) => handleBuyNow(p)}
          />
        </CustomerLayout>
      } />
      <Route path="/products/:id" element={
        <ProductDetailViewWrapper
          products={allProducts}
          handleAddToCart={handleAddToCart}
          handleBuyNow={handleBuyNow}
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
      <Route path="/favorites" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <FavoriteView
            products={allProducts}
            favoriteIds={favoriteIds}
            toggleFavorite={toggleFavorite}
            onProductClick={(p) => navigate(`/products/${p.id}`)}
            onAddToCart={(p) => handleAddToCart(p)}
            onBuyNow={(p) => handleBuyNow(p)}
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
            const selectedIds = (new URLSearchParams(location.search).get('item_ids') || '')
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean);
            await removePurchasedItems(selectedIds).catch(() => undefined);
            await syncOrdersFromService();
          }} />
        </CustomerLayout>
      } />
      <Route path="/orders" element={
        <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout} categories={categories}>
          <OrderHistoryView
            orders={orders.filter(o => o.customerId === currentUser?.id)}
            onViewDetails={(o) => navigate(`/orders/${o.id}`)}
            onNavigate={(v: any) => {
              if (v.type === 'HOME') {
                navigate('/');
              } else {
                navigate('/orders');
              }
            }}
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
      <Route path="/portal" element={<PortalEntryRedirect currentUser={currentUser} />} />
      <Route path="/portal/login" element={<Navigate to="/portal/staff/login" replace />} />
      <Route path="/portal/staff/login" element={<LoginView onLogin={handleLogin} onNavigate={() => navigate('/login')} roleType="staff" />} />
      <Route path="/portal/admin/login" element={<LoginView onLogin={handleLogin} onNavigate={() => navigate('/login')} roleType="admin" />} />

      <Route path="/portal/staff/*" element={
        currentUser?.role === 'staff' ? (
          <StaffPortalShell
            currentUser={currentUser}
            onLogout={handleLogout}
            refreshVersion={staffPortalRefreshVersion}
            orders={orders}
            products={products}
            navigate={navigate}
            confirmOrder={confirmOrder}
            consolidateOrders={consolidateOrders}
            updateOrderLogistics={updateOrderLogistics}
            createShipmentForOrder={createShipmentForOrder}
            handoverOrder={handoverOrder}
            saveProduct={saveProduct}
            deleteProduct={deleteProduct}
          />
        ) : (
          <Navigate to="/portal/staff/login" replace />
        )
      } />

      <Route path="/portal/admin/*" element={
        currentUser?.role === 'admin' ? (
          <AdminPortalShell
            currentUser={currentUser}
            onLogout={handleLogout}
            refreshVersion={adminPortalRefreshVersion}
            staffList={staffList}
            customerList={customerList}
            navigate={navigate}
            saveStaff={saveStaff}
            deleteStaff={deleteStaff}
            saveCustomer={saveCustomer}
            deleteCustomer={deleteCustomer}
          />
        ) : (
          <Navigate to="/portal/admin/login" replace />
        )
      } />

      <Route path="/portal/orders" element={<Navigate to="/portal/staff/orders" replace />} />
      <Route path="/portal/logistics" element={<Navigate to="/portal/staff/logistics" replace />} />
      <Route path="/portal/handover" element={<Navigate to="/portal/staff/handover" replace />} />
      <Route path="/portal/admin/products" element={<Navigate to="/portal/staff/products" replace />} />
      <Route path="/portal/admin/products/new" element={<Navigate to="/portal/staff/products/new" replace />} />
      <Route path="/portal/admin/products/:id" element={<PortalProductEditRedirect />} />

      {/* Auxiliary Internal Routes (Label, etc) */}
      <Route path="/portal/label/:id" element={<StaffLabelPrintWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} />} />
      <Route path="/portal/staff/label/:id" element={<StaffLabelPrintWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} />} />
      <Route path="/portal/handover" element={<StaffHandoverWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} onHandover={handoverOrder} />} />
      <Route path="/portal/staff/handover" element={<StaffHandoverWrapper orders={orders} currentUser={currentUser} onLogout={handleLogout} onHandover={handoverOrder} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

function PortalEntryRedirect({ currentUser }: { currentUser: User | null }) {
  if (currentUser?.role === 'admin') {
    return <Navigate to="/portal/admin" replace />;
  }
  if (currentUser?.role === 'staff') {
    return <Navigate to="/portal/staff" replace />;
  }
  return <Navigate to="/portal/staff/login" replace />;
}

function PortalProductEditRedirect() {
  const { id } = useParams();
  if (!id) {
    return <Navigate to="/portal/staff/products" replace />;
  }
  return <Navigate to={`/portal/staff/products/${id}`} replace />;
}

function StaffPortalShell({
  currentUser,
  onLogout,
  refreshVersion,
  orders,
  products,
  navigate,
  confirmOrder,
  consolidateOrders,
  updateOrderLogistics,
  createShipmentForOrder,
  handoverOrder,
  saveProduct,
  deleteProduct,
}: any) {
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <Routes>
        <Route
          index
          element={
            <StaffPortalHomeView
              pendingOrdersCount={orders.filter((order: Order) => order.status === 'awaiting_confirmation').length}
              pickupOrdersCount={orders.filter((order: Order) => order.status === 'awaiting_pickup' || order.status === 'awaiting_delivery').length}
              productCount={products.length}
              handoverCount={orders.filter((order: Order) => order.carrier && order.status !== 'delivered').length}
              refreshVersion={refreshVersion}
              onGoToOrders={() => navigate('/portal/staff/orders')}
              onGoToLogistics={() => navigate('/portal/staff/logistics')}
              onGoToProducts={() => navigate('/portal/staff/products')}
              onGoToHandover={() => navigate('/portal/staff/handover')}
            />
          }
        />
        <Route
          path="orders"
          element={
            <StaffOrderProcessView
              orders={orders.filter((o: Order) => o.status === 'awaiting_confirmation' || o.status === 'canceled')}
              onConfirm={confirmOrder}
              onConsolidate={consolidateOrders}
              onViewDetails={(order) => navigate(`/portal/staff/orders/${order.id}`)}
            />
          }
        />
        <Route
          path="orders/:id"
          element={<StaffOrderDetailsWrapper currentUser={currentUser} onLogout={onLogout} />}
        />
        <Route
          path="logistics"
          element={
            <StaffOrderSortView
              orders={orders.filter((o: Order) => o.status === 'awaiting_pickup' || o.status === 'awaiting_delivery')}
              onUpdateOrder={updateOrderLogistics}
              onNavigateToLabel={(o) => createShipmentForOrder(o.id)}
              onNavigateToHandover={() => navigate('/portal/staff/handover')}
            />
          }
        />
        <Route
          path="products"
          element={
            <AdminProductListView
              products={products}
              onAdd={() => navigate('/portal/staff/products/new')}
              onEdit={(p) => navigate(`/portal/staff/products/${p.id}`)}
              onDelete={deleteProduct}
            />
          }
        />
        <Route path="products/new" element={<AdminProductFormView product={undefined} onSave={saveProduct} onCancel={() => navigate('/portal/staff/products')} />} />
        <Route path="products/:id" element={<AdminProductFormWrapper products={products} onSave={saveProduct} onCancel={() => navigate('/portal/staff/products')} />} />
        <Route path="handover" element={<StaffHandoverWrapper orders={orders} currentUser={currentUser} onLogout={onLogout} onHandover={handoverOrder} />} />
        <Route path="label/:id" element={<StaffLabelPrintWrapper orders={orders} currentUser={currentUser} onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </InternalLayout>
  );
}

function AdminPortalShell({
  currentUser,
  onLogout,
  refreshVersion,
  staffList,
  customerList,
  navigate,
  saveStaff,
  deleteStaff,
  saveCustomer,
  deleteCustomer,
}: any) {
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <Routes>
        <Route
          index
          element={
            <AdminPortalHomeView
              staffCount={staffList.filter((staff: User) => staff.role === 'staff').length}
              customerCount={customerList.filter((customer: User) => customer.role === 'customer').length}
              refreshVersion={refreshVersion}
              onGoToStaff={() => navigate('/portal/admin/staff')}
              onGoToCustomers={() => navigate('/portal/admin/customers')}
            />
          }
        />
        <Route
          path="staff"
          element={
            <AdminStaffListView
              staffList={staffList}
              onAdd={() => navigate('/portal/admin/staff/new')}
              onEdit={(s) => navigate(`/portal/admin/staff/${s.id}`)}
              onDelete={deleteStaff}
            />
          }
        />
        <Route path="staff/new" element={<AdminStaffFormView staff={undefined} onSave={saveStaff} onCancel={() => navigate('/portal/admin/staff')} />} />
        <Route path="staff/:id" element={<AdminStaffFormWrapper staffList={staffList} onSave={saveStaff} onCancel={() => navigate('/portal/admin/staff')} />} />
        <Route
          path="customers"
          element={
            <AdminCustomerListView
              customerList={customerList}
              onAdd={() => navigate('/portal/admin/customers/new')}
              onEdit={(customer) => navigate(`/portal/admin/customers/${customer.id}`)}
              onDelete={deleteCustomer}
            />
          }
        />
        <Route path="customers/new" element={<AdminCustomerFormView customer={undefined} onSave={saveCustomer} onCancel={() => navigate('/portal/admin/customers')} />} />
        <Route path="customers/:id" element={<AdminCustomerFormWrapper customerList={customerList} onSave={saveCustomer} onCancel={() => navigate('/portal/admin/customers')} />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </InternalLayout>
  );
}

// Wrappers to handle params logic within App.tsx context
function ProductDetailViewWrapper({ products, handleAddToCart, handleBuyNow, selectSingleCartItem, currentUser, cart, handleLogout }: any) {
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
        onBuyNow={handleBuyNow}
        relatedProducts={products.filter((p: any) => p.category === product.category && p.id !== product.id)}
      />
    </CustomerLayout>
  );
}

function OrderDetailsViewWrapper({ orders, products, currentUser, cart, handleLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/orders" replace />;
  return (
    <CustomerLayout currentUser={currentUser} cart={cart} onLogout={handleLogout}>
      <OrderDetailsView
        orderId={id}
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

function AdminCustomerFormWrapper({ customerList, onSave, onCancel }: any) {
  const { id } = useParams();
  const customer = customerList.find((item: any) => item.id === id);
  return <AdminCustomerFormView customer={customer} onSave={onSave} onCancel={onCancel} />;
}

function StaffLabelPrintWrapper({ orders, currentUser, onLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o: any) => o.id === id);
  if (!order) return <Navigate to="/portal/staff/logistics" replace />;
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <StaffLabelPrintView order={order} onBack={() => navigate('/portal/staff/logistics')} />
    </InternalLayout>
  );
}

function StaffHandoverWrapper({ orders, currentUser, onLogout, onHandover }: any) {
  const navigate = useNavigate();
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <StaffHandoverView orders={orders} onBack={() => navigate('/portal/staff/logistics')} onHandover={onHandover} />
    </InternalLayout>
  );
}

function StaffOrderDetailsWrapper({ currentUser, onLogout }: any) {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/portal/staff/orders" replace />;
  return (
    <InternalLayout currentUser={currentUser} onLogout={onLogout}>
      <OrderDetailsView
        orderId={id}
        onBack={() => navigate('/portal/staff/orders')}
        onReview={(pid) => navigate(`/review/${pid}`)}
      />
    </InternalLayout>
  );
}

function PaymentPage({ onDone }: { onDone: () => Promise<void> }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get('payment_id') || '';
  const referenceNumber = params.get('reference_number') || '';
  const paymentUrl = params.get('payment_url') || '';
  const orderId = params.get('order_id') || '';
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    const loadQr = async () => {
      setLoadingQr(true);
      try {
        const data = await getPaymentQr({ payment_id: paymentId || undefined, reference_number: referenceNumber || undefined });
        const resolvedPaymentUrl = data.paymentUrl || paymentUrl;
        setQrImage(
          data.qrImageUrl ||
          (resolvedPaymentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(resolvedPaymentUrl)}` : '')
        );
        setExpiresAt(data.expiresAt || '');
      } catch {
        setQrImage(paymentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentUrl)}` : '');
        setExpiresAt('');
      } finally {
        setLoadingQr(false);
      }
    };
    void loadQr();
  }, [paymentId, referenceNumber, paymentUrl]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const end = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const handleTransfer = async () => {
    setSubmitting(true);
    try {
      await confirmBankTransfer({ payment_id: paymentId || undefined, reference_number: referenceNumber || undefined });
      showToast({
        tone: 'success',
        title: 'Chuyển khoản thành công',
        description: 'Đơn hàng đã được cập nhật và đang chờ xác nhận.',
      });
      await onDone();
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!success || !orderId) {
      return;
    }

    const timer = window.setTimeout(() => {
      navigate(`/orders/${orderId}`, { replace: true });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [success, orderId, navigate]);

  if (success) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border p-8 mt-8 shadow-lg text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-5">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl font-black mb-3">Thanh toán thành công</h1>
        <p className="text-sm text-gray-500">Đang chuyển đến chi tiết đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border p-6 mt-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary-light text-primary mb-4">
          <CreditCard size={24} />
        </div>
        <h1 className="text-2xl font-black mb-2">Xác nhận thanh toán</h1>
        <p className="text-sm text-gray-500">Quét mã QR bên dưới hoặc bấm nút xác nhận để hoàn tất thanh toán.</p>
      </div>
      {loadingQr ? (
        <div className="mb-6 rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">Đang tạo mã QR...</div>
      ) : qrImage ? (
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <img src={qrImage} alt="QR thanh toan" className="h-56 w-56 rounded-xl" />
          </div>
        </div>
      ) : null}

      <div className="mb-6 rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Thời gian còn lại</div>
        <div className={`text-2xl font-black ${remainingSeconds !== null && remainingSeconds <= 30 ? 'text-red-600' : 'text-primary'}`}>
          {remainingSeconds === null
            ? '—'
            : remainingSeconds > 0
              ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
              : 'Hết hạn'}
        </div>
        {expiresAt ? (
          <div className="mt-2 text-xs text-gray-500">Hết hạn lúc {new Date(expiresAt).toLocaleString('vi-VN')}</div>
        ) : null}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleTransfer}
          disabled={submitting || (remainingSeconds !== null && remainingSeconds <= 0)}
          className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 min-w-56"
        >
          {submitting ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
        </button>
      </div>
    </div>
  );
}
