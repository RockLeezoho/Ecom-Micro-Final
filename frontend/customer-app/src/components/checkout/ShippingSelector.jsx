const SHIPPING_OPTIONS = [
  { value: "standard", label: "Giao tiêu chuẩn (15.000 đ)", fee: 15000 },
  { value: "express", label: "Giao nhanh (30.000 đ)", fee: 30000 }
];

export function ShippingSelector({ value, onChange, disabled = false }) {
  return (
    <fieldset className="selection-group" disabled={disabled}>
      <legend>Phương thức vận chuyển</legend>
      {SHIPPING_OPTIONS.map((option) => (
        <label key={option.value} className="selection-option">
          <input
            type="radio"
            name="shipping-method"
            value={option.value}
            checked={value === option.value}
            onChange={(event) => onChange(event.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function getShippingFee(shippingMethod) {
  return shippingMethod === "express" ? 30000 : 15000;
}
