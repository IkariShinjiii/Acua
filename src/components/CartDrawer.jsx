import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPeso } from '../lib/currency';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useCartAvailability } from '../hooks/useCartAvailability';
import { unsplashSrcSet } from '../lib/responsiveImage';

export default function CartDrawer({ open, onClose, onViewProduct, onCheckout }) {
  const { items, removeItem, setQuantity } = useCart();
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);
  // The cart is built from whatever product snapshot was saved to
  // localStorage when each item was added — potentially days or weeks
  // ago. If ACUA marks a piece sold out (most items are 1-of-1) after
  // that, the cart would otherwise still happily offer to check out with
  // it. Revalidates against the live table every time the drawer opens.
  const { soldOutIds, revalidationFailed, availableItems, availableSubtotalCents } =
    useCartAvailability(items, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/50 z-[90]"
          />
          <motion.div
            ref={dialogRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-sand z-[100] shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
              <h2 className="font-serif text-xl text-on-surface">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-on-surface-variant">Your cart is empty.</p>
                </div>
              ) : (
                items.map(({ product, quantity }) => {
                  const isSoldOut = soldOutIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`flex gap-3 bg-surface-elevated rounded-2xl p-3 shadow-cloud-sm ${
                        isSoldOut ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          onViewProduct(product.id);
                          onClose();
                        }}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low border-none cursor-pointer p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                      >
                        <img
                          src={product.image}
                          srcSet={unsplashSrcSet(product.image)}
                          sizes="64px"
                          alt={product.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => {
                            onViewProduct(product.id);
                            onClose();
                          }}
                          className="text-sm font-medium text-on-surface hover:text-accent transition-colors bg-transparent border-none p-0 cursor-pointer text-left truncate block w-full rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                        >
                          {product.title}
                        </button>
                        {isSoldOut ? (
                          <p className="flex items-center gap-1 text-xs text-accent font-semibold mt-0.5">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" /> No longer available
                          </p>
                        ) : (
                          <p className="text-xs text-terracota-deep dark:text-terracota font-semibold mt-0.5">{product.price}</p>
                        )}
                        {!isSoldOut && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setQuantity(product.id, quantity - 1)}
                              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center border-none cursor-pointer text-on-surface hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs w-4 text-center">{quantity}</span>
                            {!product.isOneOfOne && (
                              <button
                                onClick={() => setQuantity(product.id, quantity + 1)}
                                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center border-none cursor-pointer text-on-surface hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-on-surface-variant hover:text-accent transition-colors border-none bg-transparent cursor-pointer p-2.5 -m-1.5 h-fit rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                        aria-label={`Remove ${product.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-outline-variant/30 space-y-3">
                {revalidationFailed && (
                  <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Couldn't confirm these pieces are still available — this is a connection
                      issue on our end. Double-check before sending your order.
                    </span>
                  </div>
                )}
                {soldOutIds.size > 0 && (
                  <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {soldOutIds.size === 1 ? 'One piece has' : `${soldOutIds.size} pieces have`} sold
                      since you added {soldOutIds.size === 1 ? 'it' : 'them'} — excluded from your order
                      below.
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-semibold text-on-surface">{formatPeso(availableSubtotalCents / 100)}</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onCheckout();
                  }}
                  disabled={availableItems.length === 0}
                  className="btn-terracotta w-full justify-center border-none cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  Proceed to Checkout
                </button>
                <p className="text-[10px] text-on-surface-variant text-center leading-relaxed">
                  Pay securely with GCash — you'll sign in (or create an account) to place your
                  order.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
