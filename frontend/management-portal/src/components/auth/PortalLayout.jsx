export function PortalLayout({ mode, title, subtitle, children }) {
  return (
    <div className={`portal-shell ${mode}`}>
      <main className="portal-panel">
        <header>
          <p className="portal-eyebrow">Stationery Micro</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
