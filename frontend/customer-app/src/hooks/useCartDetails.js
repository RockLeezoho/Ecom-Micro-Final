import { useCallback, useState } from "react";

import { listCartItems } from "../services/cartService";
import { getProductDetail } from "../services/productService";

function toCartDetailItem(cartItem, product) {
  const name = product?.name ?? `Sản phẩm ${cartItem.product_id}`;
  const unitPrice = Number(product?.sale_price ?? 0);
  return {
    ...cartItem,
    name,
    unit_price: unitPrice,
    subtotal: unitPrice * Number(cartItem.quantity || 0)
  };
}

export function useCartDetails() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const cartItems = await listCartItems();
      const detailResults = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const data = await getProductDetail(item.product_id);
            return toCartDetailItem(item, data.product);
          } catch {
            return toCartDetailItem(item, null);
          }
        })
      );
      setItems(detailResults);
      return detailResults;
    } catch (apiError) {
      setError(apiError.message);
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    error,
    setItems,
    setError,
    reload
  };
}
