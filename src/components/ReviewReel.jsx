import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useAnimationFrame, useReducedMotion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow } from '../lib/mapProduct';
import { handleImageError } from '../lib/imageFallback';

// px/second the reel drifts at when nothing is dragging it
const AUTO_SCROLL_SPEED = 40;
// How long to wait after a drag ends before the auto-drift resumes.
const RESUME_DELAY_MS = 600;
// "New Release" is a highlight reel, not the full catalog — capped so it
// stays a quick skim even once there are many more products than this.
const REEL_LIMIT = 8;

// Wrap a translateX value into the canonical (-lapWidth, 0] range so the
// duplicated content loops seamlessly in either direction.
function wrap(value, lapWidth) {
  if (lapWidth <= 0) return value;
  let v = value % lapWidth;
  if (v > 0) v -= lapWidth;
  return v;
}

export default function ReviewReel({ onSelectProduct, onLoaded }) {
  const [pieces, setPieces] = useState(null);
  // HomeView passes a fresh arrow function every render — a ref (rather than
  // a dependency-array entry) means this fetch effect still only ever runs
  // once on mount instead of re-firing on every parent re-render.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    let cancelled = false;
    // Sold-out items excluded deliberately: this is a "click through and buy
    // it" highlight reel, not an archive of what used to be available.
    supabase
      .from('products')
      .select('*')
      .eq('sold_out', false)
      .order('created_at', { ascending: false })
      .limit(REEL_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        setPieces(error || !data ? [] : data.map(mapProductRow));
        // Resolved either way — HomeView's full-page preloader waits on
        // this alongside its own two fetches, and a permanent fetch error
        // here shouldn't be the one thing that leaves that preloader stuck
        // forever.
        onLoadedRef.current?.();
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Seamless loop: one full duplicated set, so half the track's width is one lap.
  const duplicatedItems = pieces ? [...pieces, ...pieces] : [];

  const trackRef = useRef(null);
  const lapWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const resumeAtRef = useRef(0);
  const x = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) lapWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // Re-measure once the real items replace the initial empty track —
    // the loop math is meaningless until then.
  }, [pieces]);

  // MotionConfig's reducedMotion="user" (main.jsx) only covers Framer's own
  // declarative animate/transition props — it has no effect on this manual
  // useAnimationFrame loop, which would otherwise keep auto-scrolling
  // regardless of the OS preference. Reads the same setting directly so
  // continuous, non-essential motion actually stops for anyone who's asked
  // for it; dragging to browse manually is unaffected either way.
  const prefersReducedMotion = useReducedMotion();

  // Real-time (Framer Motion) auto-drift loop — the same clock the drag
  // gesture itself runs on, so there's no fighting between the two.
  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return;
    if (isDraggingRef.current) return;
    if (performance.now() < resumeAtRef.current) return;
    const lap = lapWidthRef.current;
    if (!lap) return;
    x.set(wrap(x.get() - (AUTO_SCROLL_SPEED * delta) / 1000, lap));
  });

  const handleDragStart = () => {
    isDraggingRef.current = true;
    dragMovedRef.current = false;
  };

  const handleDrag = (_, info) => {
    if (Math.abs(info.offset.x) > 4) dragMovedRef.current = true;
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    resumeAtRef.current = performance.now() + RESUME_DELAY_MS;
    x.set(wrap(x.get(), lapWidthRef.current));
    // dragMovedRef used to only ever get reset to false in handleDragStart
    // — meaning the *first* swipe past the 4px threshold left it stuck
    // true forever, silently swallowing every later tap's onClick (even
    // plain taps with no drag at all) until another drag happened to
    // start. The browser can still fire a native click right as a drag
    // gesture releases (the exact click this ref exists to suppress), so
    // this can't reset synchronously — deferring one tick lets that
    // trailing click see it as true and get ignored as intended, then
    // clears it in time for the visitor's next real, independent tap.
    setTimeout(() => {
      dragMovedRef.current = false;
    }, 50);
  };

  return (
    <div className="relative w-full overflow-hidden py-4 select-none">
      {/* Editorial Edge Vignette Masking (matches Framer ReviewReel overflow clip with soft fading) */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-sand via-sand/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-sand via-sand/80 to-transparent z-10" />

      {/* Draggable / auto-drifting ticker track — real drag physics (mouse,
          touch, and trackpad) via Framer Motion, same as a native carousel. */}
      <motion.div
        ref={trackRef}
        drag="x"
        dragMomentum
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex w-max gap-6 sm:gap-7 items-center cursor-grab active:cursor-grabbing"
      >
        {duplicatedItems.map((item, idx) => (
          <motion.div
            key={`${item.id}-${idx}`}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
              if (!dragMovedRef.current) onSelectProduct?.(item.id);
            }}
            role="button"
            tabIndex={0}
            aria-label={`View ${item.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectProduct?.(item.id);
              }
            }}
            className="w-[280px] sm:w-[320px] shrink-0 select-none group cursor-pointer rounded-2xl sm:rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            {/* Strict Portrait Aspect Ratio Card */}
            <div className="relative aspect-[4/5] w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-4 shadow-[0_10px_30px_-8px_rgba(174,67,30,0.08)] group-hover:shadow-[0_20px_45px_-10px_rgba(174,67,30,0.18)] transition-all duration-500 bg-sand-200">
              <img
                className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-108"
                src={item.image}
                alt={item.title}
                draggable={false}
                loading="lazy"
                onError={(e) => handleImageError(e, item.fallback)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />

              {/* Subtle Pill Tag — only for pieces actually flagged 1-of-1,
                  not every "new release" by default. */}
              {item.isOneOfOne && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-surface-elevated/85 backdrop-blur-md text-[10px] uppercase font-semibold tracking-widest text-on-surface shadow-sm">
                    1-of-1 Relic
                  </span>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="flex justify-between items-start px-2">
              <div>
                <h3 className="font-sans text-base text-on-surface font-medium group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-xs text-on-surface-variant mt-0.5 font-light">
                  {item.material}
                </p>
              </div>
              <span className="font-sans text-base text-terracota-deep dark:text-terracota font-semibold">
                {item.price}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
