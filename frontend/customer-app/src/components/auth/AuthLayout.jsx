import { Link } from "react-router-dom";

export function AuthLayout({ title, subtitle, children, alternateText, alternateLink, alternateLinkText }) {
  return (
    <div className="customer-shell">
      <div className="customer-noise" />
      <main className="customer-card">
        <header className="customer-header">
          <p className="eyebrow">Stationery Micro</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
        <p className="alternate-text">
          {alternateText} <Link to={alternateLink}>{alternateLinkText}</Link>
        </p>
      </main>
    </div>
  );
}
