import { RatingInput } from "./RatingInput";

export function ReviewForm({ formData, errors, loading, onChange, onSubmit }) {
  return (
    <form className="review-form" onSubmit={onSubmit}>
      <div className="field-group">
        <label htmlFor="orderId" className="field-label">
          Mã đơn hàng <span className="required-mark">*</span>
        </label>
        <input
          id="orderId"
          type="number"
          min="1"
          className={`field-input ${errors.orderId ? "field-input-error" : ""}`}
          value={formData.orderId}
          onChange={(event) => onChange("orderId", event.target.value)}
          disabled={loading}
        />
        {errors.orderId ? <p className="field-error">{errors.orderId}</p> : null}
      </div>

      <div className="field-group">
        <label htmlFor="productId" className="field-label">
          Mã sản phẩm <span className="required-mark">*</span>
        </label>
        <input
          id="productId"
          className={`field-input ${errors.productId ? "field-input-error" : ""}`}
          value={formData.productId}
          onChange={(event) => onChange("productId", event.target.value)}
          disabled={loading}
        />
        {errors.productId ? <p className="field-error">{errors.productId}</p> : null}
      </div>

      <div className="field-group">
        <p className="field-label">
          Đánh giá <span className="required-mark">*</span>
        </p>
        <RatingInput value={formData.rating} onChange={(value) => onChange("rating", value)} disabled={loading} />
        {errors.rating ? <p className="field-error">{errors.rating}</p> : null}
      </div>

      <div className="field-group">
        <label htmlFor="content" className="field-label">
          Nội dung đánh giá <span className="required-mark">*</span>
        </label>
        <textarea
          id="content"
          className={`field-input review-textarea ${errors.content ? "field-input-error" : ""}`}
          value={formData.content}
          onChange={(event) => onChange("content", event.target.value)}
          rows={4}
          disabled={loading}
        />
        {errors.content ? <p className="field-error">{errors.content}</p> : null}
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Đang gửi đánh giá..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
