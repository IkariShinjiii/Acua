import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import logoMarkOlive from '../assets/logo-mark-olive.png';

// EXPERIMENTAL — built on its own branch for the owner to look at before
// this goes anywhere near main. Water rises from the top of the screen
// and grows until it engulfs the whole viewport — including the logo,
// which stays faintly visible through the water's own translucency
// rather than being hidden once covered. Colors (a pale blue-gray + a
// saturated teal, per a reference the owner shared) are scoped to this
// file alone via arbitrary Tailwind/inline values, not added to the
// shared palette — nothing else on the site uses blue/teal, and this is
// still an experiment, not a decided brand addition.
//
// Earlier passes had the wave's own edge just translating upward as a
// static shape, which read as a waterfall filling a glass rather than
// surf rolling onto a shoreline — real waves have a moving, surging
// crest with foam, not a fixed silhouette. The crest here morphs between
// two hump layouts on a loop (Framer Motion animating between two `d`
// path strings with the same command structure) while also rising, and
// a stroked highlight riding the same curve as the teal crest reads as
// foam.
//
// The fade-out still waits on *real* readiness — a minimum display time
// (so a fast load doesn't just flash once) AND the window 'load' event,
// whichever finishes later — so a slow real load never gets cut short,
// but nothing lingers once the real page is actually visible.
const MIN_DISPLAY_MS = 1900;
const FILL_DURATION_S = 1.9;
const FADE_DURATION_S = 0.4;
const SURGE_DURATION_S = 1.6;

const PALE_WATER = '#D8E7E3';
const TEAL_WATER = '#3AA98D';
const FOAM = '#EAF6F2';

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

// Two crest layouts per layer, same command structure (only the control
// points move) so Framer Motion can morph directly between them — the
// "surge" that makes the water read as rolling rather than static.
const PALE_CREST_A = 'M0,55 C140,20 260,85 400,50 C540,15 660,80 780,45 C920,10 1030,70 1170,40 C1290,15 1360,50 1440,35';
const PALE_CREST_B = 'M0,40 C140,80 260,15 400,55 C540,90 660,25 780,60 C920,95 1030,40 1170,70 C1290,90 1360,45 1440,60';
const TEAL_CREST_A = 'M0,85 C130,55 250,100 390,75 C530,45 650,95 770,70 C910,50 1030,90 1170,65 C1290,50 1370,80 1440,68';
const TEAL_CREST_B = 'M0,70 C130,100 250,55 390,90 C530,105 650,60 770,95 C910,100 1030,55 1170,90 C1290,105 1370,60 1440,85';

const closeBelow = (d) => `${d} L1440,140 L0,140 Z`;

export default function Preloader() {
  const [filled, setFilled] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  // Animating the container's own `height` through a multi-keyframe
  // advance/retreat/advance array turned out to be a real Framer Motion
  // trap here — confirmed live by sampling the actual rendered height
  // every 60ms: it advanced through the early keyframes correctly, then
  // froze permanently around 82% and never reached full height, meaning
  // the preloader would never finish. True regardless of whether the
  // keyframes were unit strings ('32vh', ...) or plain pixel numbers, so
  // the problem is specifically layout-affecting `height` keyframes, not
  // units. A `y` transform (translateY) is Framer Motion's most
  // basic, reliable animatable property — the container below is a fixed
  // full-screen height and instead slides fully into place from above.
  const [viewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const SURGE_PROGRESS = [0, 0.32, 0.24, 0.58, 0.48, 0.82, 0.7, 1];
  const yKeyframes = SURGE_PROGRESS.map((p) => -(1 - p) * viewportHeight);

  useEffect(() => {
    let cancelled = false;
    Promise.all([waitForWindowLoad(), new Promise((r) => setTimeout(r, MIN_DISPLAY_MS))]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fades out once BOTH the water has actually finished engulfing the
  // screen AND the real page is ready — whichever finishes last, so
  // neither a fast page load nor a fast fill animation cuts the other
  // short.
  useEffect(() => {
    if (filled && ready) setLeaving(true);
  }, [filled, ready]);

  if (done) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: FADE_DURATION_S, ease: 'easeInOut' }}
      // Fires on every completed transition, including the (no-op) very
      // first one on mount — the `leaving` guard is what makes only the
      // real fade-out trigger the unmount below.
      onAnimationComplete={() => {
        if (leaving) setDone(true);
      }}
    >
      {/* The sand floor — matches the real page's own background, so
          anything the rising water hasn't reached yet already looks like
          the real page rather than a flash of blank color. */}
      <div className="absolute inset-0 bg-sand" />

      {/* The logo sits BELOW the water fill in stacking order, so the
          fill's own translucency is what dims it once the water passes
          over — not hidden, just faint underneath. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoMarkOlive} alt="" className="w-14 h-14 sm:w-16 sm:h-16" />
      </div>

      {/* The rising water — a fixed full-screen-tall panel that slides
          down into place from fully above the viewport, rather than a
          growing box. A single smooth 0→100% rise reads as a tank
          filling, not surf — real waves surge forward, ease back a
          little, then surge further, each push landing higher than the
          last. This keyframes that advance/retreat/advance rhythm while
          still net-progressing to full coverage by the end. */}
      <motion.div
        className="absolute inset-x-0 top-0 flex flex-col overflow-hidden"
        style={{ height: viewportHeight }}
        initial={{ y: -viewportHeight }}
        animate={{ y: yKeyframes }}
        transition={{
          duration: FILL_DURATION_S,
          times: [0, 0.18, 0.28, 0.5, 0.62, 0.82, 0.92, 1],
          ease: 'easeInOut',
        }}
        onAnimationComplete={() => setFilled(true)}
      >
        <div className="flex-1" style={{ backgroundColor: TEAL_WATER, opacity: 0.82 }} />
        <div className="relative w-full h-[110px] sm:h-[150px] flex-shrink-0" style={{ opacity: 0.85 }}>
          <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="absolute inset-0 w-full h-full block" aria-hidden="true">
            <motion.path
              d={closeBelow(PALE_CREST_A)}
              fill={PALE_WATER}
              animate={{ d: [closeBelow(PALE_CREST_A), closeBelow(PALE_CREST_B), closeBelow(PALE_CREST_A)] }}
              transition={{ duration: SURGE_DURATION_S, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d={closeBelow(TEAL_CREST_A)}
              fill={TEAL_WATER}
              animate={{ d: [closeBelow(TEAL_CREST_A), closeBelow(TEAL_CREST_B), closeBelow(TEAL_CREST_A)] }}
              transition={{ duration: SURGE_DURATION_S * 0.85, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Foam — an open (unclosed) stroke tracing the exact same
                curve as the teal crest above, so the highlight always
                rides right at the waterline rather than needing its own
                separately-tuned path. */}
            <motion.path
              d={TEAL_CREST_A}
              fill="none"
              stroke={FOAM}
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.75"
              animate={{ d: [TEAL_CREST_A, TEAL_CREST_B, TEAL_CREST_A] }}
              transition={{ duration: SURGE_DURATION_S * 0.85, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
