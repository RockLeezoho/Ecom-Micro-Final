const ORDER_STATUS_MAP = {
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", tone: "warning" },
  SHIPPING: { label: "Đang giao", tone: "info" },
  DELIVERED: { label: "Đã giao", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "danger" }
};

const PAYMENT_STATUS_MAP = {
  PAID: { label: "Đã thanh toán", tone: "success" },
  UNPAID: { label: "Chưa thanh toán", tone: "muted" }
};

function Badge({ mapping, value }) {
  const status = mapping[value] ?? { label: value || "Không xác định", tone: "muted" };
  return <span className={`status-badge status-${status.tone}`}>{status.label}</span>;
}

export function OrderStatusBadge({ status, paymentStatus }) {
  return (
    <div className="status-row">
      <Badge mapping={ORDER_STATUS_MAP} value={status} />
      {paymentStatus ? <Badge mapping={PAYMENT_STATUS_MAP} value={paymentStatus} /> : null}
    </div>
  );
}
