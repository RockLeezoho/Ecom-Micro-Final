import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { OrderStatusBadge } from "../../components/order/OrderStatusBadge";
import { trackBehaviorEvent } from "../../services/aiService";
import { getOrderHistory, payOrder } from "../../services/orderService";
import { submitPayment } from "../../services/paymentService";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadOrderData() {
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

    loadOrderData();
  }, [orderId]);

  const order = useMemo(
    () => orders.find((item) => String(item.id) === String(orderId)),
    [orders, orderId]
  );

  async function handlePayOrder() {
    if (!order) {
      return;
    }

    try {
      setPaying(true);
      setError("");
      await submitPayment({
        orderId: order.id,
        paymentMethod: order.payment_method,
        amount: Number(order.final_total)
      });
      const paidOrder = await payOrder(order.id);
      setOrders((current) => current.map((item) => (item.id === paidOrder.id ? paidOrder : item)));
      (paidOrder.items ?? []).forEach((item) => {
        trackBehaviorEvent({
          event_type: "purchase",
          product_id: item.product_id,
          price: Number(item.unit_price) * Number(item.quantity),
          order_id: String(paidOrder.id),
          shipping_method: paidOrder.shipping_method,
          payment_method: paidOrder.payment_method,
          total_amount: Number(paidOrder.final_total),
          quantity: Number(item.quantity),
          currency: "VND"
        });
      });
      setSuccess("Thanh toán thành công. Đơn hàng đang chờ xác nhận.");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <LoadingState message="Đang tải chi tiết đơn hàng..." />;
  }

  if (!order) {
    return (
      <section className="product-content">
        <EmptyState message="Không tìm thấy đơn hàng." />
        <Link to="/orders" className="product-link">
          Quay lại danh sách đơn hàng
        </Link>
      </section>
    );
  }

  return (
    <section className="product-content">
      <Link to="/orders" className="product-link">
        ← Quay lại lịch sử đơn hàng
      </Link>

      <header className="section-header">
        <h2>Chi tiết đơn hàng #{order.id}</h2>
        <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
      </header>

      <ErrorAlert message={error} />
      {success ? <p className="submit-success">{success}</p> : null}

      <section className="order-card">
        <p>
          Vận chuyển: <strong>{order.shipping_method}</strong>
        </p>
        <p>
          Thanh toán: <strong>{order.payment_method}</strong>
        </p>
        <p>
          Phí vận chuyển: <strong>{Number(order.shipping_fee).toLocaleString("vi-VN")} đ</strong>
        </p>
        <p>
          Tạm tính: <strong>{Number(order.items_total).toLocaleString("vi-VN")} đ</strong>
        </p>
        <p>
          Thành tiền: <strong>{Number(order.final_total).toLocaleString("vi-VN")} đ</strong>
        </p>
      </section>

      <section className="checkout-items">
        <h3>Sản phẩm trong đơn</h3>
        {order.items.map((item) => (
          <article key={item.product_id} className="checkout-item-row">
            <div>
              <h4>{item.product_name}</h4>
              <p>Mã: {item.product_id}</p>
            </div>
            <p>x{item.quantity}</p>
            <p>{Number(item.unit_price).toLocaleString("vi-VN")} đ</p>
          </article>
        ))}
      </section>

      <div className="order-actions">
        {order.payment_status !== "PAID" ? (
          <button type="button" className="submit-btn" onClick={handlePayOrder} disabled={paying}>
            {paying ? "Đang thanh toán..." : "Thanh toán đơn hàng"}
          </button>
        ) : null}
        <Link to={`/reviews?orderId=${order.id}`} className="product-link">
          Gửi đánh giá cho sản phẩm đã nhận
        </Link>
      </div>
    </section>
  );
}
