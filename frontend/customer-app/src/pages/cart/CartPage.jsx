import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CartItemCard } from "../../components/cart/CartItemCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { LoadingState } from "../../components/common/LoadingState";
import { useCartDetails } from "../../hooks/useCartDetails";
import { saveCheckoutSelection } from "../../services/checkoutState";
import { removeCartItem, updateCartItemQuantity } from "../../services/cartService";

export function CartPage() {
  const navigate = useNavigate();
  const { items, loading, error, reload, setError } = useCartDetails();
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setSelectedIds((current) => {
      const existing = new Set(current);
      const defaultSelected = items.filter((item) => item.selected).map((item) => item.product_id);
      if (existing.size === 0) {
        saveCheckoutSelection(defaultSelected);
        return defaultSelected;
      }
      const next = current.filter((id) => items.some((item) => item.product_id === id));
      saveCheckoutSelection(next);
      return next;
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.product_id)),
    [items, selectedIds]
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
    [selectedItems]
  );

  function toggleSelected(productId) {
    setSelectedIds((current) => {
      const set = new Set(current);
      if (set.has(productId)) {
        set.delete(productId);
      } else {
        set.add(productId);
      }
      const next = Array.from(set);
      saveCheckoutSelection(next);
      return next;
    });
  }

  async function changeQuantity(item, delta) {
    const nextQuantity = item.quantity + delta;
    if (nextQuantity <= 0) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await updateCartItemQuantity({ productId: item.product_id, quantity: nextQuantity });
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(productId) {
    try {
      setSaving(true);
      setError("");
      await removeCartItem(productId);
      await reload();
      setSelectedIds((current) => {
        const next = current.filter((id) => id !== productId);
        saveCheckoutSelection(next);
        return next;
      });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  function proceedCheckout() {
    if (selectedIds.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    navigate("/checkout", { state: { selectedIds } });
  }

  return (
    <section className="product-content checkout-layout">
      <header className="section-header">
        <h2>Giỏ hàng của bạn</h2>
        <p>{items.length} sản phẩm trong giỏ</p>
      </header>

      <ErrorAlert message={error} />

      {loading ? <LoadingState message="Đang tải giỏ hàng..." /> : null}
      {!loading && items.length === 0 ? <EmptyState message="Giỏ hàng trống. Hãy thêm vài sản phẩm bạn thích." /> : null}

      {!loading && items.length > 0 ? (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <CartItemCard
                key={item.product_id}
                item={item}
                checked={selectedIds.includes(item.product_id)}
                onToggle={toggleSelected}
                onIncrease={(target) => changeQuantity(target, 1)}
                onDecrease={(target) => changeQuantity(target, -1)}
                onRemove={handleRemove}
                disabled={saving}
              />
            ))}
          </div>

          <footer className="checkout-footer">
            <div>
              <p className="checkout-caption">Đã chọn {selectedItems.length} sản phẩm</p>
              <p className="checkout-total">Tạm tính: {subtotal.toLocaleString("vi-VN")} đ</p>
            </div>
            <button type="button" className="submit-btn" onClick={proceedCheckout} disabled={saving || selectedIds.length === 0}>
              Thanh toán sản phẩm đã chọn
            </button>
          </footer>
        </>
      ) : null}
    </section>
  );
}
