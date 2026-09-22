import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, AlertCircle } from 'lucide-react';
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
  // A failed fetch and a genuinely empty catalog used to look identical —
  // both just left `pieces`/`archiveItems` as []. That meant an actual
  // Supabase outage or an expired API key would show visitors "no pieces
  // in this category yet," making a real technical failure look like an
  // empty, abandoned store instead of a "something's wrong, try again."
  const [piecesFailed, setPiecesFailed] = useState(false);
  const [archiveFailed, setArchiveFailed] = useState(false);
  // Shared by the mount effect and the "Try Again" button's manual retry —
  // a ref (not a closure-local flag) since it needs to still say "don't
  // touch state" after unmount regardless of which call started the fetch.
  const unmountedRef = useRef(false);

  const loadPieces = useCallback(() => {
    setPieces(null);
    setPiecesFailed(false);
    return supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (unmountedRef.current) return;
        if (error || !data) {
          setPiecesFailed(true);
          setPieces([]);
          return;
        }
        setPieces(data.map(mapProductRow));
      })
      .catch(() => {
        // A genuine network failure (not a resolved { error }) rejects
        // instead of resolving — without this, it would otherwise leave
        // pieces stuck on "Loading pieces…" forever rather than showing
        // the same error state as a resolved { error } does.
        if (unmountedRef.current) return;
        setPiecesFailed(true);
        setPieces([]);
      });
  }, []);

  const loadArchive = useCallback(() => {
    setArchiveItems(null);
    setArchiveFailed(false);
    return supabase
      .from('archive_items')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (unmountedRef.current) return;
        if (error || !data) {
          setArchiveFailed(true);
          setArchiveItems([]);
          return;
        }
        setArchiveItems(data.map(mapArchiveRow));
      })
      .catch(() => {
        if (unmountedRef.current) return;
        setArchiveFailed(true);
        setArchiveItems([]);
      });
  }, []);

  useEffect(() => {
    // React 18 StrictMode deliberately mounts, cleans up, and re-mounts
    // every effect once in development to catch exactly this class of
    // bug: without resetting the flag here, the first (fake) cleanup
    // would permanently poison unmountedRef for the second, real mount,
    // silently discarding every fetch's result for the rest of the
    // component's life.
    unmountedRef.current = false;
    loadPieces();
    loadArchive();
    return () => {
      unmountedRef.current = true;
    };
  }, [loadPieces, loadArchive]);

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
        {/* dvh (not svh) tracks the *current* browser-chrome state rather
            than assuming it's always maximally expanded — on iOS Safari,
            100svh could fall a little short of what's actually visible at
            first paint, letting the next section's heading peek up right
            behind the bottom toolbar with no breathing room. */}
        <section className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-ink">
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
        {/* pt-12 is a deliberate cushion, not just spacing preference — even
            with the dvh fix above, a hero and the section right after it
            should never sit flush against each other with zero margin; that's
            what let the heading crowd into the toolbar-covered sliver in the
            first place. */}
        <section className="w-full pt-12 sm:pt-16 mb-28 sm:mb-36 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-on-surface font-normal tracking-tight">
                New Release
              </h2>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1.5 hidden sm:block">
                Seasonal artifacts hand-sculpted in limited batches
              </p>
            </div>

            <a
              className="font-sans text-xs font-semibold text-accent hover:text-terracota transition-colors underline underline-offset-4 tracking-wider uppercase"
              href="#available-pieces"
            >
              VIEW ALL
            </a>
          </div>

          <ReviewReel onSelectProduct={onViewProduct} />
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
                    className={`px-6 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                      isActive
                        ? 'bg-ink text-white shadow-md active:scale-95'
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
          {piecesFailed && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="w-5 h-5 text-accent" />
              <p className="text-sm text-on-surface-variant max-w-sm">
                Couldn't load Available Pieces right now — this is a connection issue on our end,
                not an empty catalog.
              </p>
              <button
                onClick={loadPieces}
                className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
              >
                Try Again
              </button>
            </div>
          )}
          {pieces !== null && !piecesFailed && filteredPieces.length === 0 && (
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
                  className="group relative cursor-pointer rounded-[24px] sm:rounded-[32px] bg-surface-elevated shadow-[0_12px_35px_-8px_rgba(38,28,20,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(38,28,20,0.12)] transition-all duration-500 overflow-hidden flex flex-col border-none p-5 sm:p-6"
                >
                  {/* A card that's itself a button, wrapping the real Add to
                      Cart/Request Similar buttons, is an ARIA anti-pattern —
                      nested interactive controls aren't reliably announced
                      and can trap focus for assistive tech (flagged by an
                      axe-core audit). This "stretched link" button instead
                      sits as a sibling covering the whole card at the lowest
                      z-index; the visual content above it is
                      pointer-events-none so clicks fall through to it,
                      except the two real action buttons below, which opt
                      back in with pointer-events-auto so they still work
                      independently. */}
                  <button
                    type="button"
                    onClick={() => onViewProduct?.(piece.id)}
                    aria-label={`View ${piece.title}`}
                    className="absolute inset-0 z-0 rounded-[24px] sm:rounded-[32px] border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
                  />

                  {/* Square Aspect Ratio Product Thumbnail */}
                  <div className="relative z-10 pointer-events-none w-full aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-5">
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
                  <div className="relative z-10 pointer-events-none flex-grow flex flex-col justify-between">
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
                          onClick={() => onRequestSimilar?.({ ...piece, source: 'catalog' })}
                          className="pointer-events-auto text-[11px] font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors border-none bg-transparent cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
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
                          onClick={() => handleAdd(piece)}
                          className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated ${
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

            {archiveFailed && (
              <div className="flex flex-col items-center gap-3 pb-16 text-center">
                <AlertCircle className="w-5 h-5 text-accent" />
                <p className="text-sm text-on-surface-variant max-w-sm">
                  Couldn't load The Archive right now — try again in a moment.
                </p>
                <button
                  onClick={loadArchive}
                  className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* 4-Column Asymmetric Staggered Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
              {!archiveFailed && archiveItems?.map((item) => (
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
                  <div className="absolute inset-0 bg-chile-rojo/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 text-center backdrop-blur-[2px]">
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
    </div>
  );
}
