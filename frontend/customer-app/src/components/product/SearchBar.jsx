export function SearchBar({ value, onChange, onSubmit, loading }) {
  return (
    <form className="product-search-bar" onSubmit={onSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm bút, sổ, dụng cụ học tập..."
        className="field-input"
        disabled={loading}
      />
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Đang tìm..." : "Tìm kiếm"}
      </button>
    </form>
  );
}
