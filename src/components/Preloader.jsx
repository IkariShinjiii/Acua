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
// The crest shape went through two real revisions: a first pass with
// small, evenly-spaced humps read as a generic "wavy line," not the
// reference's few, large, irregular rounded mounds with dramatic height
// variation — redrawn with a taller canvas and fewer, bigger curves so
// the silhouette itself reads as water rather than a repeating pattern.
// The fill also gained a top-to-bottom gradient (plus a soft highlight
// near the crest) instead of one flat color, for some actual depth
// rather than a flat poster-color panel.
//
// Earlier passes also had the crest just translating upward as a static
// shape, which read as a waterfall filling a glass rather than surf
// rolling onto a shoreline. The crest morphs between two mound layouts on
// a loop (Framer Motion animating between two `d` path strings with the
// same command structure) while also rising, and a stroked highlight
// riding the same curve as the teal crest reads as foam.
//
// The fade-out still waits on *real* readiness — a minimum display time
// (so a fast load doesn't just flash once) AND the window 'load' event,
// whichever finishes later — so a slow real load never gets cut short,
// but nothing lingers once the real page is actually visible.
const MIN_DISPLAY_MS = 1800;
const FILL_DURATION_S = 1.7;
const FADE_DURATION_S = 0.4;
const SURGE_DURATION_S = 1.15;

const PALE_WATER = '#D8E7E3';
const TEAL_LIGHT = '#4FC3A6';
const TEAL_DEEP = '#1F8A72';
const FOAM = '#F1FAF7';

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

// Few, large, irregular mounds with dramatic height swings (a tall 240
// viewBox gives room for that range) rather than many small, evenly
// spaced humps — matching the reference's rounded, varied-scale blob
// shapes instead of a generic repeating wavy line. Each *_B variant keeps
// the exact same command structure as its *_A pair (only the control
// points move) so Framer Motion can morph directly between them.
const PALE_CREST_A =
  'M0,120 C240,10 400,230 660,90 C880,5 1020,235 1260,80 C1350,30 1410,110 1440,90';
const PALE_CREST_B =
  'M0,95 C240,230 400,10 660,140 C880,235 1020,5 1260,130 C1350,180 1410,50 1440,100';
const TEAL_CREST_A =
  'M0,140 C220,30 380,220 640,110 C860,20 1000,230 1240,100 C1340,40 1400,120 1440,100';
const TEAL_CREST_B =
  'M0,110 C220,220 380,25 640,150 C860,230 1000,15 1240,140 C1340,190 1400,60 1440,110';

const closeBelow = (d) => `${d} L1440,240 L0,240 Z`;

export default function Preloader() {
  const [filled, setFilled] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  // Animating the container's own `height` through a multi-keyframe
  // advance/retreat/advance array turned out to be a real Framer Motion
  // trap — confirmed live by sampling the actual rendered height over
  // time: it advanced through the early keyframes correctly, then froze
  // permanently partway through and never reached full height, meaning
  // the preloader would never finish. True regardless of whether the
  // keyframes were unit strings or plain pixel numbers, so the problem is
  // specifically layout-affecting `height` keyframes, not units. A `y`
  // transform (translateY) is Framer Motion's most basic, reliable
  // animatable property — the container below is a fixed full-screen
  // height and instead slides fully into place from above.
  const [viewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const SURGE_PROGRESS = [0, 0.34, 0.24, 0.6, 0.46, 0.85, 0.68, 1];
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
        <div
          className="flex-1"
          style={{ background: `linear-gradient(180deg, ${TEAL_LIGHT} 0%, ${TEAL_DEEP} 100%)`, opacity: 0.85 }}
        />
        <div className="relative w-full h-[170px] sm:h-[230px] flex-shrink-0" style={{ opacity: 0.88 }}>
          <svg
            viewBox="0 0 1440 240"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full block"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="preloader-teal-crest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL_LIGHT} />
                <stop offset="100%" stopColor={TEAL_DEEP} />
              </linearGradient>
            </defs>
            <motion.path
              d={closeBelow(PALE_CREST_A)}
              fill={PALE_WATER}
              animate={{ d: [closeBelow(PALE_CREST_A), closeBelow(PALE_CREST_B), closeBelow(PALE_CREST_A)] }}
              transition={{ duration: SURGE_DURATION_S, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d={closeBelow(TEAL_CREST_A)}
              fill="url(#preloader-teal-crest)"
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
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.8"
              animate={{ d: [TEAL_CREST_A, TEAL_CREST_B, TEAL_CREST_A] }}
              transition={{ duration: SURGE_DURATION_S * 0.85, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
