import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, onAddToCart, onViewProduct, actionDisabled = false }) {
  return (
    <section className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewProduct={onViewProduct}
          actionDisabled={actionDisabled}
        />
      ))}
    </section>
  );
}
