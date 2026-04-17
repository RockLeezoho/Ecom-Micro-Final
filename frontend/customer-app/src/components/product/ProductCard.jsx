import { Link } from "react-router-dom";

export function ProductCard({ product, onAddToCart, onViewProduct, actionDisabled = false }) {
  return (
    <article className="product-card">
      <p className="product-meta">{product.category_slug}</p>
      <h3>{product.name}</h3>
      <p className="product-price">{Number(product.sale_price).toLocaleString("vi-VN")} đ</p>
      <div className="product-tags">
        <span>{product.brand}</span>
        <span>{product.origin}</span>
        <span>{product.language}</span>
        <span>{product.age_group}</span>
      </div>
      <Link to={`/products/${product.id}`} className="product-link" onClick={() => onViewProduct?.(product)}>
        Xem chi tiết
      </Link>
      <button
        type="button"
        className="secondary-btn"
        onClick={() => onAddToCart?.(product)}
        disabled={actionDisabled}
      >
        Thêm vào giỏ
      </button>
    </article>
  );
}
