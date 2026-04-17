export function RatingInput({ value, onChange, disabled = false }) {
  return (
    <div className="rating-input" role="radiogroup" aria-label="Đánh giá sao">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={`star-btn ${value >= star ? "star-active" : ""}`}
          onClick={() => onChange(star)}
          disabled={disabled}
          aria-label={`${star} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
