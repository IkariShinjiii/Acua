import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Check, ShieldCheck, Truck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow } from '../lib/mapProduct';
import { handleImageError } from '../lib/imageFallback';
import { useCart } from '../context/CartContext';

export default function ProductDetailView({ productId, setCurrentView, onRequestSimilar }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProduct(error || !data ? null : mapProductRow(data));
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    document.title = product ? `${product.title} | ACUA` : 'ACUA | Handcrafted by the Coast';
  }, [product]);

  if (product === undefined) {
    return <div className="min-h-screen bg-sand pt-40 text-center text-sm text-on-surface-variant">Loading…</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <p className="text-sm text-on-surface-variant">That piece couldn't be found.</p>
          <button
            onClick={() => setCurrentView('home')}
            className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <button
          onClick={() => {
            setCurrentView('home');
            setTimeout(() => document.getElementById('available-pieces')?.scrollIntoView(), 50);
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-accent transition-colors mb-8 border-none bg-transparent cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Available Pieces
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden bg-surface-container-low shadow-[0_12px_35px_-8px_rgba(38,28,20,0.08)]"
          >
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, product.fallback)}
            />
            {product.soldOut && (
              <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                <span className="bg-surface-elevated text-on-surface text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full">
                  Sold Out
                </span>
              </div>
            )}
          </motion.div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">
              {product.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface leading-tight">
              {product.title}
            </h1>
            <p className="text-2xl font-semibold text-terracota mt-4">{product.price}</p>
            {product.isOneOfOne && !product.soldOut && (
              <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent bg-chile-rojo/10 rounded-full px-3 py-1 mt-3">
                One of one — once it's gone, it's gone
              </span>
            )}

            <p className="text-sm text-on-surface/80 leading-relaxed mt-6">{product.description}</p>

            <div className="mt-6 p-4 rounded-2xl bg-surface-elevated shadow-cloud-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Material
              </p>
              <p className="text-sm text-on-surface">{product.material}</p>
            </div>

            <div className="mt-8">
              {product.soldOut ? (
                <button
                  onClick={() => onRequestSimilar?.({ ...product, source: 'catalog' })}
                  className="w-full sm:w-auto bg-chile-rojo hover:brightness-90 text-white font-sans text-xs uppercase font-semibold tracking-[0.18em] h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                >
                  Request Similar Piece
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {/* A one-of-one piece only ever has one unit to sell — see
                      plan.md 5.2 — so there's nothing for a quantity stepper
                      to control. */}
                  {!product.isOneOfOne && (
                    <div className="flex items-center gap-3 bg-surface-elevated rounded-full px-4 py-2.5 shadow-cloud-sm w-fit">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center border-none cursor-pointer text-on-surface hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm w-5 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center border-none cursor-pointer text-on-surface hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 sm:flex-none font-sans text-xs uppercase font-semibold tracking-[0.18em] h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center gap-2 border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                      added ? 'bg-olive text-white' : 'bg-chile-rojo hover:brightness-90 text-white'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/30 space-y-3">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Handmade in small batches — every piece is one-of-a-kind</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Truck className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Ships nationwide from Iloilo City</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
