export function CategoryCard({ category, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`category-card ${selected ? "category-card-selected" : ""}`}
      onClick={() => onSelect(category.slug)}
    >
      <h3>{category.name}</h3>
      <p>{category.slug}</p>
    </button>
  );
}
