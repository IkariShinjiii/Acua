import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../components/SocialIcons';
import ReviewReel from '../components/ReviewReel';
import { handleImageError } from '../lib/imageFallback';
import { FILTER_TABS } from '../data/products';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow, mapArchiveRow } from '../lib/mapProduct';
import { useCart } from '../context/CartContext';

export default function HomeView({ setCurrentView, onRequestSimilar, onViewProduct }) {
  const { items: cartItems, addItem } = useCart();
  const [activeFilter, setActiveFilter] = useState('All');
  const [addedItem, setAddedItem] = useState(null);
  const [pieces, setPieces] = useState(null);
  const [archiveItems, setArchiveItems] = useState(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setPieces(error || !data ? [] : data.map(mapProductRow));
      });

    supabase
      .from('archive_items')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setArchiveItems(error || !data ? [] : data.map(mapArchiveRow));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = (piece) => {
    addItem(piece);
    setAddedItem(piece.id);
    setTimeout(() => setAddedItem(null), 1600);
  };

  const filteredPieces =
    pieces === null
      ? []
      : activeFilter === 'All'
      ? pieces
      : pieces.filter((p) => p.category === activeFilter);

  return (
    <div className="bg-sand text-on-surface font-sans antialiased min-h-screen flex flex-col selection:bg-chile-rojo selection:text-white">
      <main className="flex-grow">

        {/* 1. Hero Section */}
        <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink">
          <div
            className="absolute inset-0 bg-cover bg-center w-full h-full"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85')",
            }}
          />
          {/* Warm Overlay Gradient — darkens the photo for white text, so it
              stays fixed-dark regardless of theme (bg-ink, not the
              theme-aware on-surface, which would invert to near-white and
              wash the photo out in dark mode). */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
            <h1 className="font-serif text-white text-[2.75rem] leading-[1.05] sm:text-6xl md:text-7xl tracking-tight max-w-3xl drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
              Naturally rooted,
              <br />
              intentionally <span className="italic text-sunset">designed</span>.
            </h1>

            <p className="mt-7 max-w-md text-white/80 text-base sm:text-lg font-sans font-light drop-shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
              Handcrafted accessories inspired by the tides — non-tarnish finishes, natural
              stones, and salvaged sea glass for coastal permanence.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('available-pieces');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-chile-rojo hover:brightness-90 text-white font-sans text-xs uppercase font-semibold tracking-[0.18em] h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                SHOP NEW COLLECTION
              </button>
              <button
                onClick={() => setCurrentView('commission')}
                className="border border-white/40 text-white font-sans text-xs uppercase font-semibold tracking-[0.18em] h-14 px-9 rounded-full hover:border-sunset hover:text-sunset transition-colors duration-300 inline-flex items-center justify-center bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                CUSTOM REQUEST
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <span className="text-white/60 text-[0.65rem] uppercase tracking-[0.3em] font-sans">
              Scroll
            </span>
            <motion.span
              className="h-8 w-px bg-sunset/60 origin-top"
              animate={{ scaleY: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </section>

        {/* 2. New Arrivals: Framer ReviewReel Infinite Marquee Carousel */}
        <section className="w-full mb-28 sm:mb-36 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-on-surface font-normal tracking-tight">
                New Release
              </h2>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1.5 hidden sm:block">
                Seasonal artifacts hand-sculpted in limited batches — hover to inspect
              </p>
            </div>

            <a
              className="font-sans text-xs font-semibold text-accent hover:text-terracota transition-colors underline underline-offset-4 tracking-wider uppercase"
              href="#available-pieces"
            >
              VIEW ALL
            </a>
          </div>

          <ReviewReel
            onSelectProduct={() => {
              const el = document.getElementById('available-pieces');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>

        {/* 3. Available Pieces: Filter Tabs & Cloud UI Product Cards */}
        <section
          id="available-pieces"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-28 sm:mb-36"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-on-surface font-normal tracking-tight">
                Available Pieces
              </h2>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1.5">
                Singular artifacts hand-assembled for modern permanence
              </p>
            </div>

            {/* Clean Pill Filter Tabs */}
            <div className="flex flex-wrap gap-2.5">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-6 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer border-none ${
                      isActive
                        ? 'bg-on-surface text-white shadow-md active:scale-95'
                        : 'bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-sunset/30 hover:border-terracota/40'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {pieces === null && (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading pieces…</p>
          )}
          {pieces !== null && filteredPieces.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant py-16">
              No pieces in this category yet.
            </p>
          )}

          {/* 3-Column Bento Cloud Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="group cursor-pointer rounded-[24px] sm:rounded-[32px] bg-surface-elevated shadow-[0_12px_35px_-8px_rgba(38,28,20,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(38,28,20,0.12)] transition-all duration-500 overflow-hidden flex flex-col border-none p-5 sm:p-6"
                  onClick={() => onViewProduct?.(piece.id)}
                >
                  {/* Square Aspect Ratio Product Thumbnail */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-5">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={piece.image}
                      alt={piece.title}
                      loading="lazy"
                      onError={(e) => handleImageError(e, piece.fallback)}
                    />
                    {piece.soldOut && (
                      <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                        <span className="bg-surface-elevated text-on-surface text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                          Sold Out
                        </span>
                      </div>
                    )}
                    {piece.isOneOfOne && !piece.soldOut && (
                      <span className="absolute top-3 left-3 bg-chile-rojo text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        1-of-1
                      </span>
                    )}
                  </div>

                  {/* Card Description & Action Row */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-sans text-base sm:text-lg text-on-surface font-medium mb-1.5 group-hover:text-accent transition-colors">
                        {piece.title}
                      </h3>
                      <p className="font-sans text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed font-light">
                        {piece.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-surface-container">
                      <span className="font-sans text-base text-terracota font-semibold">
                        {piece.price}
                      </span>
                      {piece.soldOut ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestSimilar?.({ ...piece, source: 'catalog' });
                          }}
                          className="text-[11px] font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors border-none bg-transparent cursor-pointer"
                        >
                          Request Similar
                        </button>
                      ) : piece.isOneOfOne && cartItems.some((i) => i.product.id === piece.id) ? (
                        // Only one unit will ever exist to fulfill (plan.md
                        // 5.2) — once it's in the cart, the button reflects
                        // that permanently instead of the usual momentary
                        // checkmark, which would otherwise invite another
                        // click that CartContext just silently no-ops.
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-olive/15 text-olive"
                          aria-label={`${piece.title} is already in your cart`}
                          title="Already in your cart"
                        >
                          <Check className="w-5 h-5 stroke-[2]" />
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(piece);
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-none cursor-pointer ${
                            addedItem === piece.id
                              ? 'bg-chile-rojo text-white'
                              : 'bg-surface-container-low text-accent hover:bg-chile-rojo hover:text-white'
                          }`}
                          aria-label={`Add ${piece.title} to cart`}
                        >
                          {addedItem === piece.id ? (
                            <Check className="w-5 h-5 stroke-[2]" />
                          ) : (
                            <Plus className="w-5 h-5 stroke-[2]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* 4. The Archive: Bespoke Creations Showcase */}
        <section className="bg-surface-container-low py-24 sm:py-32 border-t border-outline-variant/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-serif text-3xl sm:text-5xl text-on-surface mb-4 font-normal tracking-tight">
                The Archive
              </h2>
              <p className="font-sans text-sm sm:text-base text-on-surface-variant leading-relaxed font-light">
                Past 1-of-1 creations. Sold out, but forever inspiring. Browse the
                archive to spark ideas for your custom coastal piece.
              </p>
            </div>

            {/* 4-Column Asymmetric Staggered Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
              {archiveItems?.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl md:rounded-3xl overflow-hidden ${item.aspect} ${item.mt} shadow-[0_10px_30px_-8px_rgba(38,28,20,0.06)] bg-sand-200`}
                >
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale-[20%] group-hover:grayscale-0"
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    onError={(e) => handleImageError(e, item.fallback)}
                  />
                  <div className="absolute inset-0 bg-chile-rojo/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 text-center backdrop-blur-[2px]">
                    <span className="bg-terracota text-white font-sans text-xs font-semibold px-4 py-2 rounded-full tracking-wider shadow-sm">
                      1-OF-1
                    </span>
                    {item.title && (
                      <p className="font-serif text-white text-base sm:text-lg leading-tight">
                        {item.title}
                      </p>
                    )}
                    <button
                      onClick={() => onRequestSimilar?.({ ...item, source: 'archive' })}
                      className="bg-surface-elevated text-accent font-sans text-[11px] font-semibold uppercase tracking-wider px-4 py-2 rounded-full shadow-sm hover:bg-sunset transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo"
                    >
                      Request Similar Piece
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentView('commission')}
                className="bg-chile-rojo hover:brightness-90 text-white font-sans text-xs uppercase font-semibold tracking-wider h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
              >
                START A CUSTOM REQUEST
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Deep Terracotta Footer */}
      <footer className="w-full mt-auto bg-chile-rojo text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="bg-sand px-4 py-2 rounded-lg shadow-sm inline-flex items-center justify-center">
              <span className="font-serif text-2xl tracking-[0.22em] text-on-surface font-normal uppercase">
                ACUA
              </span>
            </div>
            <span className="text-xs uppercase tracking-widest text-sunset opacity-95 font-medium mt-1 font-sans">
              NATURALLY ROOTED. INTENTIONALLY DESIGNED.
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs font-sans uppercase tracking-wider font-semibold">
            <a className="text-white/80 hover:text-white transition-colors" href="#sustainability">
              Sustainability
            </a>
            <a className="text-white/80 hover:text-white transition-colors" href="#shipping">
              Shipping
            </a>
            <a className="text-white/80 hover:text-white transition-colors" href="#returns">
              Returns
            </a>
            <a
              className="text-white/80 hover:text-white transition-colors"
              href="mailto:acuavibe@gmail.com"
            >
              Contact
            </a>
          </nav>

          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/acua_ph/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="ACUA on Instagram"
                className="text-white/80 hover:text-sunset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo rounded-full"
              >
                <InstagramIcon className="w-[18px] h-[18px]" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61577296311917"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="ACUA on Facebook"
                className="text-white/80 hover:text-sunset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo rounded-full"
              >
                <FacebookIcon className="w-[18px] h-[18px]" />
              </a>
            </div>
            <div className="text-xs font-sans uppercase tracking-wider text-white/70 text-center md:text-right">
              © 2024 ACUA. HANDCRAFTED BY THE COAST.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
