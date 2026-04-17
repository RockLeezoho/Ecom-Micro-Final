export function PortalInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled
}) {
  return (
    <div className="portal-field">
      <label htmlFor={id}>
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
        className={error ? "has-error" : ""}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
