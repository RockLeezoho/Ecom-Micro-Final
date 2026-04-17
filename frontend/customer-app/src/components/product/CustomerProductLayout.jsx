import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { AIChatbox } from "../ai/AIChatbox";
import { clearCustomerToken } from "../../services/tokenStorage";

const pageTitleMap = {
  "/products": "Khám phá sản phẩm",
  "/cart": "Giỏ hàng",
  "/checkout": "Thanh toán",
  "/orders": "Lịch sử đơn hàng",
  "/reviews": "Đánh giá sản phẩm"
};

export function CustomerProductLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const matchedKey = Object.keys(pageTitleMap).find((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );
  const pageTitle = matchedKey ? pageTitleMap[matchedKey] : "Không gian mua sắm";

  function handleLogout() {
    clearCustomerToken();
    navigate("/auth/login", { replace: true });
  }

  return (
    <div className="customer-shell">
      <div className="customer-noise" />
      <main className="customer-card product-shell">
        <header className="product-header">
          <div>
            <p className="eyebrow">Stationery Micro</p>
            <h1>{pageTitle}</h1>
          </div>
          <nav className="product-nav">
            <Link to="/products">Danh mục & sản phẩm</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Đơn hàng</Link>
            <Link to="/reviews">Đánh giá</Link>
            <button type="button" className="secondary-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </nav>
        </header>
        <Outlet />
      </main>
      <AIChatbox />
    </div>
  );
}
