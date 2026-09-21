import React, { createContext, useContext, useEffect, useState } from 'react';
import { parsePesoToNumber } from '../lib/currency';

const CartContext = createContext(null);
// v2: product ids switched from static strings ('ap-1') to real Supabase
// UUIDs once the storefront was wired to the database — bumped so any
// cart saved under the old id scheme doesn't resolve to the wrong/missing
// product.
const STORAGE_KEY = 'acua-cart-v2';

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Defensive: a cart saved before the one-of-one cap existed (or from a
    // bug) could already hold quantity > 1 for a piece that only ever has
    // one unit to fulfill. Clamp on load rather than trusting old state.
    return parsed.map((i) => (i.product?.isOneOfOne ? { ...i, quantity: 1 } : i));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage can throw in private-browsing/blocked-storage contexts —
      // the cart just won't persist across reloads in that case, not fatal.
    }
  }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        // A one-of-one piece only ever has one unit to fulfill — see plan.md
        // 5.2 (first-payment-wins, no reservation) — so it can't go past 1.
        if (product.isOneOfOne) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const setQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const capped = i.product.isOneOfOne ? Math.min(quantity, 1) : quantity;
        return { ...i, quantity: capped };
      })
    );
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, i) => sum + parsePesoToNumber(i.product.price) * 100 * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, count, subtotalCents, addItem, removeItem, setQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
