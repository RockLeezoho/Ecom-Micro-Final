import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { OrderSummaryCard } from "../../components/checkout/OrderSummaryCard";
import { PaymentMethodSelector } from "../../components/checkout/PaymentMethodSelector";
import { ShippingSelector, getShippingFee } from "../../components/checkout/ShippingSelector";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { OrderStatusBadge } from "../../components/order/OrderStatusBadge";
import { trackBehaviorEvent } from "../../services/aiService";
import { useCartDetails } from "../../hooks/useCartDetails";
import { clearSelectedCartItems } from "../../services/cartService";
import { clearCheckoutSelection, loadCheckoutSelection } from "../../services/checkoutState";
import { checkoutOrder, payOrder } from "../../services/orderService";
import { submitPayment } from "../../services/paymentService";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, loading, error, reload } = useCartDetails();
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [selectedIds, setSelectedIds] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paying, setPaying] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const fromRoute = location.state?.selectedIds;
    const persisted = loadCheckoutSelection();
    if (Array.isArray(fromRoute) && fromRoute.length > 0) {
      setSelectedIds(fromRoute);
      return;
    }
    setSelectedIds(persisted);
  }, [location.state]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.product_id)),
    [items, selectedIds]
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
    [selectedItems]
  );

  const shippingFee = useMemo(() => getShippingFee(shippingMethod), [shippingMethod]);
  const discount = 0;
  const finalTotal = subtotal + shippingFee - discount;

  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (selectedItems.length === 0) {
      setSubmitError("Không có sản phẩm nào được chọn để đặt hàng.");
      return;
    }

    try {
      setPlacingOrder(true);
      const order = await checkoutOrder({
        selected_product_ids: selectedItems.map((item) => item.product_id),
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price)
        }))
      });
      await clearSelectedCartItems(selectedItems.map((item) => item.product_id));
      clearCheckoutSelection();
      setCreatedOrder(order);
      setSuccessMessage("Đặt hàng thành công. Vui lòng thực hiện thanh toán để hoàn tất.");
      await reload();
    } catch (apiError) {
      setSubmitError(apiError.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  async function handlePay() {
    if (!createdOrder) {
      return;
    }

    try {
      setPaying(true);
      setSubmitError("");
      await submitPayment({
        orderId: createdOrder.id,
        paymentMethod: createdOrder.payment_method,
        amount: Number(createdOrder.final_total)
      });
      const paidOrder = await payOrder(createdOrder.id);
      setCreatedOrder(paidOrder);
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
      setSuccessMessage("Thanh toán thành công. Đơn hàng đang chờ xác nhận.");
    } catch (apiError) {
      setSubmitError(apiError.message);
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className="product-content checkout-layout">
      <header className="section-header">
        <h2>Thanh toán</h2>
        <p>Kiểm tra sản phẩm, chọn vận chuyển và thanh toán đơn hàng.</p>
      </header>

      <ErrorAlert message={error || submitError} />
      {successMessage ? <p className="submit-success">{successMessage}</p> : null}

      {loading ? <LoadingState message="Đang tải thông tin thanh toán..." /> : null}
      {!loading && selectedItems.length === 0 && !createdOrder ? (
        <div>
          <EmptyState message="Bạn chưa chọn sản phẩm nào để thanh toán." />
          <Link to="/cart" className="product-link">
            Quay lại giỏ hàng
          </Link>
        </div>
      ) : null}

      {!loading && (selectedItems.length > 0 || createdOrder) ? (
        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
            <section className="checkout-items">
              <h3>Sản phẩm đã chọn</h3>
              {(createdOrder?.items ?? selectedItems).map((item) => (
                <article key={item.product_id} className="checkout-item-row">
                  <div>
                    <h4>{item.product_name || item.name || item.product_id}</h4>
                    <p>Mã sản phẩm: {item.product_id}</p>
                  </div>
                  <p>x{item.quantity}</p>
                  <p>{Number(item.unit_price).toLocaleString("vi-VN")} đ</p>
                </article>
              ))}
            </section>

            <ShippingSelector value={shippingMethod} onChange={setShippingMethod} disabled={placingOrder || Boolean(createdOrder)} />
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} disabled={placingOrder || Boolean(createdOrder)} />

            {!createdOrder ? (
              <button type="submit" className="submit-btn" disabled={placingOrder || selectedItems.length === 0}>
                {placingOrder ? "Đang tạo đơn hàng..." : "Đặt hàng"}
              </button>
            ) : null}
          </form>

          <div className="checkout-side">
            <OrderSummaryCard
              subtotal={createdOrder?.items_total ?? subtotal}
              shippingFee={createdOrder?.shipping_fee ?? shippingFee}
              discount={discount}
              finalTotal={createdOrder?.final_total ?? finalTotal}
              itemCount={(createdOrder?.items ?? selectedItems).reduce((acc, item) => acc + Number(item.quantity || 0), 0)}
            />

            {createdOrder ? (
              <section className="payment-panel">
                <h3>Thanh toán đơn hàng #{createdOrder.id}</h3>
                <OrderStatusBadge status={createdOrder.status} paymentStatus={createdOrder.payment_status} />
                {createdOrder.payment_status !== "PAID" ? (
                  <button type="button" className="submit-btn" onClick={handlePay} disabled={paying}>
                    {paying ? "Đang thanh toán..." : "Thanh toán ngay"}
                  </button>
                ) : (
                  <button type="button" className="secondary-btn" onClick={() => navigate("/orders")}>Xem lịch sử đơn hàng</button>
                )}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
