const defaultFilterState = {
  minSalePrice: "",
  maxSalePrice: "",
  brand: "",
  origin: "",
  language: "",
  ageGroup: ""
};

export function FilterPanel({ filters, onChange, onApply, onClear, loading }) {
  return (
    <section className="filter-panel">
      <h2>Bộ lọc sản phẩm</h2>
      <div className="filter-grid">
        <label>
          Giá từ
          <input
            type="number"
            min="0"
            className="field-input"
            value={filters.minSalePrice}
            onChange={(event) => onChange("minSalePrice", event.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Giá đến
          <input
            type="number"
            min="0"
            className="field-input"
            value={filters.maxSalePrice}
            onChange={(event) => onChange("maxSalePrice", event.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Thương hiệu
          <input
            className="field-input"
            value={filters.brand}
            onChange={(event) => onChange("brand", event.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Xuất xứ
          <input
            className="field-input"
            value={filters.origin}
            onChange={(event) => onChange("origin", event.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Ngôn ngữ
          <input
            className="field-input"
            value={filters.language}
            onChange={(event) => onChange("language", event.target.value)}
            disabled={loading}
          />
        </label>
        <label>
          Độ tuổi
          <input
            className="field-input"
            value={filters.ageGroup}
            onChange={(event) => onChange("ageGroup", event.target.value)}
            disabled={loading}
          />
        </label>
      </div>
      <div className="filter-actions">
        <button type="button" className="submit-btn" onClick={onApply} disabled={loading}>
          Áp dụng
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            onClear(defaultFilterState);
          }}
          disabled={loading}
        >
          Xóa bộ lọc
        </button>
      </div>
    </section>
  );
}
