import { Navigate, Route, Routes } from "react-router-dom";

import { CustomerProductLayout } from "../components/product/CustomerProductLayout";
import { CustomerLoginPage } from "../pages/auth/CustomerLoginPage";
import { CustomerRegisterPage } from "../pages/auth/CustomerRegisterPage";
import { CartPage } from "../pages/cart/CartPage";
import { CheckoutPage } from "../pages/checkout/CheckoutPage";
import { OrderDetailPage } from "../pages/orders/OrderDetailPage";
import { OrderHistoryPage } from "../pages/orders/OrderHistoryPage";
import { ProductDetailPage } from "../pages/products/ProductDetailPage";
import { ProductDiscoveryPage } from "../pages/products/ProductDiscoveryPage";
import { ReviewPage } from "../pages/reviews/ReviewPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<CustomerLoginPage />} />
      <Route path="/auth/register" element={<CustomerRegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<CustomerProductLayout />}>
          <Route path="/products" element={<ProductDiscoveryPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
