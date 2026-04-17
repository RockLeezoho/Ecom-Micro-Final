import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { OrderStatusBadge } from "../../components/order/OrderStatusBadge";
import { getOrderHistory } from "../../services/orderService";

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const data = await getOrderHistory();
        setOrders(data);
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <section className="product-content">
      <header className="section-header">
        <h2>Lịch sử đơn hàng</h2>
        <p>Theo dõi trạng thái đơn hàng và thanh toán của bạn.</p>
      </header>

      <ErrorAlert message={error} />
      {loading ? <LoadingState message="Đang tải lịch sử đơn hàng..." /> : null}

      {!loading && orders.length === 0 ? <EmptyState message="Bạn chưa có đơn hàng nào." /> : null}

      {!loading && orders.length > 0 ? (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-head">
                <h3>Đơn hàng #{order.id}</h3>
                <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
              </div>

              <p>
                Vận chuyển: <strong>{order.shipping_method}</strong> | Thanh toán: <strong>{order.payment_method}</strong>
              </p>
              <p>
                Tổng tiền: <strong>{Number(order.final_total).toLocaleString("vi-VN")} đ</strong>
              </p>

              <div className="order-actions">
                <Link to={`/orders/${order.id}`} className="product-link">
                  Xem chi tiết
                </Link>
                <Link to={`/reviews?orderId=${order.id}`} className="product-link">
                  Đánh giá sản phẩm
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
