import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { ReviewForm } from "../../components/review/ReviewForm";
import { trackBehaviorEvent } from "../../services/aiService";
import { getOrderHistory } from "../../services/orderService";
import { listProductReviews, submitReview } from "../../services/reviewService";

export function ReviewPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    orderId: searchParams.get("orderId") ?? "",
    productId: searchParams.get("productId") ?? "",
    rating: 5,
    content: ""
  });
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    async function loadReviews() {
      if (!formData.productId.trim()) {
        setReviews([]);
        return;
      }
      try {
        setReviewLoading(true);
        const data = await listProductReviews(formData.productId.trim());
        setReviews(data);
      } catch {
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    }

    loadReviews();
  }, [formData.productId]);

  const reviewableItems = useMemo(() => {
    return orders
      .filter((order) => order.status === "DELIVERED")
      .flatMap((order) =>
        order.items.map((item) => ({
          orderId: order.id,
          productId: item.product_id,
          productName: item.product_name
        }))
      );
  }, [orders]);

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function applyReviewTarget(item) {
    setFormData((current) => ({
      ...current,
      orderId: String(item.orderId),
      productId: item.productId
    }));
  }

  function validate() {
    const nextErrors = {};
    if (!formData.orderId || Number(formData.orderId) < 1) {
      nextErrors.orderId = "Vui lòng nhập mã đơn hợp lệ.";
    }
    if (!formData.productId.trim()) {
      nextErrors.productId = "Vui lòng nhập mã sản phẩm.";
    }
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      nextErrors.rating = "Vui lòng chọn số sao từ 1 đến 5.";
    }
    if (!formData.content.trim() || formData.content.trim().length < 3) {
      nextErrors.content = "Nội dung đánh giá tối thiểu 3 ký tự.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await submitReview({
        orderId: Number(formData.orderId),
        productId: formData.productId.trim(),
        rating: Number(formData.rating),
        content: formData.content.trim()
      });
      trackBehaviorEvent({
        event_type: "rating_review",
        product_id: formData.productId.trim(),
        order_id: String(formData.orderId),
        rating: Number(formData.rating),
        review_text: formData.content.trim()
      });
      setSuccess("Đánh giá đã được gửi thành công.");
      setFormData((current) => ({ ...current, content: "", rating: 5 }));
      const data = await listProductReviews(formData.productId.trim());
      setReviews(data);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="product-content review-layout">
      <header className="section-header">
        <h2>Đánh giá sản phẩm</h2>
        <p>Bạn chỉ có thể đánh giá sản phẩm của đơn đã nhận hàng.</p>
      </header>

      <ErrorAlert message={error} />
      {success ? <p className="submit-success">{success}</p> : null}

      {loading ? <LoadingState message="Đang tải dữ liệu đơn hàng..." /> : null}

      {!loading ? (
        <div className="review-grid">
          <section className="order-card">
            <h3>Sản phẩm có thể đánh giá</h3>
            {reviewableItems.length === 0 ? (
              <EmptyState message="Hiện chưa có đơn nào ở trạng thái đã giao." />
            ) : (
              <div className="reviewable-list">
                {reviewableItems.map((item) => (
                  <button
                    key={`${item.orderId}-${item.productId}`}
                    type="button"
                    className="review-target-btn"
                    onClick={() => applyReviewTarget(item)}
                  >
                    Đơn #{item.orderId} - {item.productName}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="order-card">
            <h3>Gửi đánh giá</h3>
            <ReviewForm
              formData={formData}
              errors={errors}
              loading={submitting}
              onChange={updateField}
              onSubmit={handleSubmit}
            />
          </section>

          <section className="order-card review-history">
            <h3>Đánh giá gần đây cho sản phẩm</h3>
            {reviewLoading ? <LoadingState message="Đang tải đánh giá..." /> : null}
            {!reviewLoading && reviews.length === 0 ? (
              <EmptyState message="Chưa có đánh giá cho sản phẩm này." />
            ) : null}
            {!reviewLoading && reviews.length > 0 ? (
              <div className="review-list">
                {reviews.map((review) => (
                  <article key={`${review.order_id}-${review.customer_id}-${review.created_at}`} className="review-card">
                    <p className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</p>
                    <p>{review.content}</p>
                    <small>
                      Đơn #{review.order_id} - Khách hàng #{review.customer_id}
                    </small>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
