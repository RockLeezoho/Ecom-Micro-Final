export function ErrorAlert({ message }) {
  if (!message) {
    return null;
  }
  return <p className="error-alert">{message}</p>;
}
