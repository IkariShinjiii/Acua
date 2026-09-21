import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPeso } from '../lib/currency';

export default function CartDrawer({ open, onClose, onViewProduct }) {
  const { items, subtotalCents, removeItem, setQuantity } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1d1c16]/50 z-[90]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#F9F6F0] z-[100] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#dec0b7]/30">
              <h2 className="font-serif text-xl text-[#1d1c16]">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#f2ede4] transition-colors border-none bg-transparent cursor-pointer text-[#1d1c16]"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-[#57423b]">Your cart is empty.</p>
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 bg-white rounded-2xl p-3 shadow-cloud-sm">
                    <button
                      onClick={() => {
                        onViewProduct(product.id);
                        onClose();
                      }}
                      className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#f8f3ea] border-none cursor-pointer p-0"
                    >
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          onViewProduct(product.id);
                          onClose();
                        }}
                        className="text-sm font-medium text-[#1d1c16] hover:text-chile-rojo transition-colors bg-transparent border-none p-0 cursor-pointer text-left truncate block w-full"
                      >
                        {product.title}
                      </button>
                      <p className="text-xs text-terracota font-semibold mt-0.5">{product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 rounded-full bg-[#f2ede4] flex items-center justify-center border-none cursor-pointer text-[#1d1c16] hover:bg-[#ece8df]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 rounded-full bg-[#f2ede4] flex items-center justify-center border-none cursor-pointer text-[#1d1c16] hover:bg-[#ece8df]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-[#57423b] hover:text-chile-rojo transition-colors border-none bg-transparent cursor-pointer p-1 h-fit"
                      aria-label={`Remove ${product.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-[#dec0b7]/30 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#57423b]">Subtotal</span>
                  <span className="font-semibold text-[#1d1c16]">{formatPeso(subtotalCents / 100)}</span>
                </div>
                <a
                  href={`mailto:acuavibe@gmail.com?subject=${encodeURIComponent(
                    'Order inquiry from acuaproject.vercel.app'
                  )}&body=${encodeURIComponent(
                    `Hi ACUA! I'd like to order:\n\n${items
                      .map((i) => `- ${i.product.title} x${i.quantity} (${i.product.price})`)
                      .join('\n')}\n\nSubtotal: ${formatPeso(subtotalCents / 100)}`
                  )}`}
                  className="btn-terracotta w-full justify-center"
                >
                  Email to Order
                </a>
                <p className="text-[10px] text-[#57423b] text-center leading-relaxed">
                  Online checkout isn't live yet — this drafts an email with your cart so we can
                  confirm payment and shipping directly.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
