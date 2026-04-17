export function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false
}) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="required-mark"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`field-input ${error ? "field-input-error" : ""}`}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
