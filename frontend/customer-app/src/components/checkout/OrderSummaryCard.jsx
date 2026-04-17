export function OrderSummaryCard({ subtotal, shippingFee, discount = 0, finalTotal, itemCount }) {
  return (
    <section className="summary-card">
      <h3>Tóm tắt đơn hàng</h3>
      <dl>
        <div>
          <dt>Số sản phẩm</dt>
          <dd>{itemCount}</dd>
        </div>
        <div>
          <dt>Tạm tính</dt>
          <dd>{Number(subtotal).toLocaleString("vi-VN")} đ</dd>
        </div>
        <div>
          <dt>Phí vận chuyển</dt>
          <dd>{Number(shippingFee).toLocaleString("vi-VN")} đ</dd>
        </div>
        <div>
          <dt>Giảm giá</dt>
          <dd>-{Number(discount).toLocaleString("vi-VN")} đ</dd>
        </div>
        <div className="summary-total">
          <dt>Thành tiền</dt>
          <dd>{Number(finalTotal).toLocaleString("vi-VN")} đ</dd>
        </div>
      </dl>
    </section>
  );
}
