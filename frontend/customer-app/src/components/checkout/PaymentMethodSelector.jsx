const PAYMENT_OPTIONS = [
  { value: "cod", label: "Tiền mặt khi nhận hàng (COD)" },
  { value: "card", label: "Thẻ tín dụng/Ghi nợ" },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng" }
];

export function PaymentMethodSelector({ value, onChange, disabled = false }) {
  return (
    <fieldset className="selection-group" disabled={disabled}>
      <legend>Phương thức thanh toán</legend>
      {PAYMENT_OPTIONS.map((option) => (
        <label key={option.value} className="selection-option">
          <input
            type="radio"
            name="payment-method"
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
