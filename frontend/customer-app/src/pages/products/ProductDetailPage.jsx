import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { trackBehaviorEvent } from "../../services/aiService";
import { addCartItem } from "../../services/cartService";
import { getProductDetail } from "../../services/productService";
import { listProductReviews } from "../../services/reviewService";

export function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingCart, setSubmittingCart] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    async function loadProductDetail() {
      try {
        setLoading(true);
        setError("");
        const [data, reviewData] = await Promise.all([getProductDetail(productId), listProductReviews(productId)]);
        setProduct(data.product ?? null);
        setReviews(reviewData ?? []);
      } catch (apiError) {
        setError(apiError.message);
        setProduct(null);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    loadProductDetail();
  }, [productId]);

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const viewedAt = Date.now();
    return () => {
      const spentSeconds = Math.max(1, Math.round((Date.now() - viewedAt) / 1000));
      trackBehaviorEvent({
        event_type: "product_view",
        product_id: product.id,
        category_id: product.category_slug,
        price: Number(product.sale_price),
        time_spent_seconds: spentSeconds
      });
    };
  }, [product]);

  if (loading) {
    return <LoadingState message="Đang tải chi tiết sản phẩm..." />;
  }

  if (error) {
    return (
      <section className="product-content">
        <ErrorAlert message={error} />
        <Link to="/products" className="product-link">
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-content">
        <EmptyState message="Không tìm thấy sản phẩm." />
        <Link to="/products" className="product-link">
          Quay lại danh sách
        </Link>
      </section>
    );
  }

  async function handleAddToCart() {
    try {
      setSubmittingCart(true);
      setError("");
      setSubmitSuccess("");
      await addCartItem({ productId: product.id, quantity: 1 });
      trackBehaviorEvent({
        event_type: "add_to_cart",
        product_id: product.id,
        category_id: product.category_slug,
        price: Number(product.sale_price),
        quantity: 1
      });
      setSubmitSuccess("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmittingCart(false);
    }
  }

  return (
    <section className="product-content">
      <Link to="/products" className="product-link">
        ← Quay lại danh sách
      </Link>
      <article className="product-detail-card">
        <p className="product-meta">{product.category_slug}</p>
        <h2>{product.name}</h2>
        <p className="product-price">{Number(product.sale_price).toLocaleString("vi-VN")} đ</p>
        <p>{product.description}</p>
        <div className="product-tags">
          <span>Thương hiệu: {product.brand}</span>
          <span>Xuất xứ: {product.origin}</span>
          <span>Ngôn ngữ: {product.language}</span>
          <span>Độ tuổi: {product.age_group}</span>
        </div>
        <div className="product-tags">
          {(product.tags ?? []).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        {submitSuccess ? <p className="submit-success">{submitSuccess}</p> : null}
        <button type="button" className="submit-btn" onClick={handleAddToCart} disabled={submittingCart}>
          {submittingCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
        </button>
        <Link to="/cart" className="product-link">
          Đi tới giỏ hàng
        </Link>
      </article>

      <section className="review-history">
        <h3>Đánh giá sản phẩm</h3>
        {reviews.length === 0 ? <EmptyState message="Chưa có đánh giá nào cho sản phẩm này." /> : null}
        {reviews.length > 0 ? (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={`${review.order_id}-${review.customer_id}-${review.created_at}`} className="review-card">
                <p className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</p>
                <p>{review.content}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
