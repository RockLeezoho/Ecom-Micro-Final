export function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="loading-skeleton" aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className="skeleton-line" />
      ))}
    </div>
  );
}
