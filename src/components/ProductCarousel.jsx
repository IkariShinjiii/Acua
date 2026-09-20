import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';

/**
 * Dual-Inventory Catalog Data
 * Combines rare 1-of-1 bespoke items with repeatable core heirloom products.
 */
const PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Solstice Molten Cuff',
    subtitle: 'Sculptural Hand-Poured Cuff',
    price: 640,
    inventoryType: '1-of-1', // '1-of-1' | 'repeatable'
    editionBadge: '1 of 1 · Unique Piece',
    materials: 'Fairmined 18k Yellow Gold',
    image: 'https://images.unsplash.com/photo-1611591475819-797de2338ff8?auto=format&fit=crop&w=800&q=80',
    status: 'Available',
  },
  {
    id: 'prod-2',
    title: 'Tidal Baroque Pearl Choker',
    subtitle: 'Raw Oceanic Strand',
    price: 420,
    inventoryType: '1-of-1',
    editionBadge: '1 of 1 · Unique Piece',
    materials: 'Keshi Freshwater Pearl & Recycled Silver',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    status: 'Available',
  },
  {
    id: 'prod-3',
    title: 'Dune Undulating Band',
    subtitle: 'Heirloom Core Collection',
    price: 290,
    inventoryType: 'repeatable',
    editionBadge: 'Core Collection · Made to Order',
    materials: 'Solid 14k Warm Gold',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    status: 'Ships in 7-10 Days',
  },
  {
    id: 'prod-4',
    title: 'Terra Carnelian Talisman',
    subtitle: 'Chiseled Earth Gemstone',
    price: 510,
    inventoryType: '1-of-1',
    editionBadge: '1 of 1 · Unique Piece',
    materials: 'Natural Carnelian & 18k Gold Bezel',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    status: 'Available',
  },
  {
    id: 'prod-5',
    title: 'Sienna Fluid Wave Hoops',
    subtitle: 'Artisanal Everyday Signature',
    price: 215,
    inventoryType: 'repeatable',
    editionBadge: 'Core Collection',
    materials: 'Recycled 925 Sterling Silver',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
    status: 'In Stock',
  },
  {
    id: 'prod-6',
    title: 'Aura Keshi Drop Earrings',
    subtitle: 'Asymmetric Molten Drops',
    price: 360,
    inventoryType: '1-of-1',
    editionBadge: '1 of 1 · Unique Piece',
    materials: 'Australian Keshi & 18k Wire',
    image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80',
    status: 'Available',
  },
];

/**
 * HorizontalProductCarousel Component
 * High-converting Framer Motion horizontal carousel with dual-inventory badges,
 * smooth drag physics, arrow controls, and progress tracking.
 */
export default function HorizontalProductCarousel({ onAddToCart }) {
  const carouselRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update progress indicator and scroll button disabled states on scroll
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
  };

  // Programmatic scroll step (approx 1.5 cards wide)
  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const offset = direction === 'left' ? -380 : 380;
    carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header with Editorial Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-terracotta-500" />
            <span className="text-xs uppercase tracking-widest font-semibold text-terracotta-700">
              Dual Inventory Collection
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-normal">
            Rare 1-of-1 Artifacts & Core Heirlooms
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-espresso-700 max-w-2xl font-sans">
            Swipe through our current releases. Unique pieces are singular creations never to be cast again; repeatable pieces are made to order in our studio.
          </p>
        </div>

        {/* Carousel Navigation Buttons & Indicators */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous products"
            className="p-3 rounded-full border border-sand-300 bg-sand-50 text-espresso-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terracotta-50 hover:border-terracotta-400 transition-colors shadow-soft-sand active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next products"
            className="p-3 rounded-full border border-sand-300 bg-sand-50 text-espresso-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-terracotta-50 hover:border-terracotta-400 transition-colors shadow-soft-sand active:scale-95"
          >
            <ChevronRight className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Smooth Horizontal Scrolling Track */}
      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PRODUCTS.map((product) => {
          const isUnique = product.inventoryType === '1-of-1';

          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="group relative flex-none w-[280px] sm:w-[320px] lg:w-[340px] snap-start bg-sand-50 rounded-3xl p-3 border border-sand-200/90 shadow-soft-sand hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
            >
              {/* Product Image Container */}
              <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden bg-sand-200">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Top Badge: 1-of-1 Unique vs Repeatable Heirloom */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-xs ${
                      isUnique
                        ? 'bg-terracotta-700/90 text-white border border-terracotta-400/40'
                        : 'bg-sand-50/90 text-espresso-800 border border-sand-300'
                    }`}
                  >
                    {isUnique && <Sparkles className="w-3 h-3 text-terracotta-200" />}
                    <span>{product.editionBadge}</span>
                  </span>
                </div>

                {/* Quick Action Overlay (Reveals on card hover) */}
                <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sand-50/95 backdrop-blur-md text-espresso-900 hover:bg-terracotta-600 hover:text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Quick Add</span>
                  </button>
                </div>
              </div>

              {/* Product Details Block */}
              <div className="p-3 pt-4 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] tracking-wider uppercase font-medium text-espresso-600">
                    {product.materials}
                  </span>
                  <span className="text-sm font-semibold text-espresso-900 font-sans">
                    ${product.price}
                  </span>
                </div>

                <h3 className="font-serif text-lg text-espresso-900 font-medium group-hover:text-terracotta-700 transition-colors">
                  {product.title}
                </h3>
                
                <p className="text-xs text-espresso-600 line-clamp-1">
                  {product.subtitle}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-sand-200/80 mt-2">
                  <span className="text-terracotta-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" />
                    {product.status}
                  </span>
                  <span className="text-espresso-600 group-hover:underline">
                    View Details
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visual Scrollbar Progress Tracker */}
      <div className="mt-4 max-w-xs mx-auto flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-sand-500 font-medium">Scroll</span>
        <div className="flex-1 h-1 bg-sand-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-terracotta-500 rounded-full"
            style={{ width: `${Math.max(15, scrollProgress)}%` }}
          />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-sand-500 font-medium">Browse</span>
      </div>

    </div>
  );
}
