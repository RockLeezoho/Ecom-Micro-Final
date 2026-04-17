export function CartItemCard({
  item,
  checked,
  onToggle,
  onIncrease,
  onDecrease,
  onRemove,
  disabled = false
}) {
  return (
    <article className="cart-item-card">
      <label className="cart-select">
        <input type="checkbox" checked={checked} onChange={() => onToggle(item.product_id)} disabled={disabled} />
        <span>Chọn</span>
      </label>

      <div className="cart-thumb" aria-hidden>
        {item.name?.slice(0, 1)?.toUpperCase() ?? "P"}
      </div>

      <div className="cart-item-main">
        <h3>{item.name || `Sản phẩm ${item.product_id}`}</h3>
        <p className="cart-meta">Mã: {item.product_id}</p>
        <p className="cart-price">{Number(item.unit_price || 0).toLocaleString("vi-VN")} đ</p>
      </div>

      <div className="cart-quantity">
        <button type="button" className="secondary-btn" onClick={() => onDecrease(item)} disabled={disabled || item.quantity <= 1}>
          -
        </button>
        <span>{item.quantity}</span>
        <button type="button" className="secondary-btn" onClick={() => onIncrease(item)} disabled={disabled}>
          +
        </button>
      </div>

      <p className="cart-subtotal">{Number(item.subtotal || 0).toLocaleString("vi-VN")} đ</p>

      <button type="button" className="danger-btn" onClick={() => onRemove(item.product_id)} disabled={disabled}>
        Xóa
      </button>
    </article>
  );
}
