import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import logoMarkOlive from '../assets/logo-mark-olive.png';
import { whenPreloaderUnheld } from '../lib/preloaderGate';

// Opaque teal water comes down from the top of the screen in
// advance/retreat/advance surges until it covers the whole viewport, hiding
// the logo as it passes over. The water's leading (bottom) edge is an
// irregular, morphing wave traced by a translucent foam line; below that
// line is open sand. The teal is scoped to this file rather than the shared
// palette, since nothing else on the site uses it.
//
// The fade-out waits on *real* readiness, whichever finishes last: a
// minimum display time (so a fast load doesn't just flash once), the window
// 'load' event, and any view holding the preloader until its first data has
// arrived (see lib/preloaderGate — HomeView does) — capped at MAX_HOLD_MS so
// a slow API can never keep the site covered.
const MIN_DISPLAY_MS = 1800;
const MAX_HOLD_MS = 4000;
const FILL_DURATION_S = 1.7;
const FADE_DURATION_S = 0.4;
const SURGE_DURATION_S = 1.15;

const TEAL_LIGHT = '#4FC3A6';
const TEAL_DEEP = '#1F8A72';
const FOAM = '#F1FAF7';
// The site's own `bg-sand` token is a very pale, almost-white cream --
// right for a real page background, but on its own behind a wave meant to
// read as water meeting a beach, it looked closer to plain white than
// sand. This is a warmer, more visibly beige tone, scoped to the
// preloader alone rather than changing the shared token everywhere else.
const SAND_BEIGE = '#E4D3AE';

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
const TEAL_CREST_A =
  'M0,140 C220,30 380,220 640,110 C860,20 1000,230 1240,100 C1340,40 1400,120 1440,100';
const TEAL_CREST_B =
  'M0,110 C220,220 380,25 640,150 C860,230 1000,15 1240,140 C1340,190 1400,60 1440,110';

// The water comes down from the top, so the crest is its *bottom* edge —
// the fill closes upward to meet the body above, and everything below the
// curve stays open sand.
const closeAbove = (d) => `${d} L1440,0 L0,0 Z`;

// Below the crest, the water was one flat gradient rectangle — accurate
// depth-wise, but the sheer size of that plain field next to the one
// curved edge at the top is exactly what read as "boxy." These are thin,
// open (unstroked, not filled) current lines living inside that body at
// a few different depths, each drifting between two gentle curves on its
// own loop — the same "real water has movement everywhere, not just at
// its edge" idea as the crest, just fainter and slower since they're
// meant to read as something glimpsed beneath the surface, not a second
// wave.
const RIPPLE_A = 'M0,20 C200,2 400,38 640,16 C880,-4 1080,42 1300,12 C1380,4 1420,22 1440,14';
const RIPPLE_B = 'M0,12 C200,38 400,-2 640,26 C880,42 1080,2 1300,30 C1380,38 1420,6 1440,20';

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
  const [crestHeight] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 640 ? 230 : 170
  );
  const [crestD, setCrestD] = useState(TEAL_CREST_A);
  // The panel is one crest-height taller than the screen so that at full
  // coverage the solid body fills the viewport and the wavy edge (with the
  // open sand beneath it) sits just past the bottom — otherwise a strip of
  // sand would still show under the last wave.
  const panelHeight = viewportHeight + crestHeight;
  const SURGE_PROGRESS = [0, 0.34, 0.24, 0.6, 0.46, 0.85, 0.68, 1];
  const yKeyframes = SURGE_PROGRESS.map((p) => -(1 - p) * panelHeight);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      waitForWindowLoad(),
      new Promise((r) => setTimeout(r, MIN_DISPLAY_MS)),
      Promise.race([whenPreloaderUnheld(), new Promise((r) => setTimeout(r, MAX_HOLD_MS))]),
    ]).then(() => {
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
      {/* The sand floor — a warmer beige than the real page's own pale
          background (see SAND_BEIGE above), since here it needs to read
          as an actual beach the water is rolling onto, not just a neutral
          page backdrop. */}
      <div className="absolute inset-0" style={{ background: SAND_BEIGE }} />

      {/* The logo sits BELOW the water in stacking order, and the water is
          opaque, so it disappears once the wave passes over it. */}
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
        style={{ height: panelHeight }}
        initial={{ y: -panelHeight }}
        animate={{ y: yKeyframes }}
        transition={{
          duration: FILL_DURATION_S,
          times: [0, 0.18, 0.28, 0.5, 0.62, 0.82, 0.92, 1],
          ease: 'easeInOut',
        }}
        onAnimationComplete={() => setFilled(true)}
      >
        {/* The crest below picks up in solid TEAL_DEEP exactly where this
            gradient ends — a second gradient restarting at TEAL_LIGHT at
            that boundary was the cause of an earlier hard seam. */}
        <div
          className="relative flex-1 overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${TEAL_LIGHT} 0%, ${TEAL_DEEP} 100%)` }}
        >
          <svg
            viewBox="0 0 1440 50"
            preserveAspectRatio="none"
            className="absolute inset-x-0 w-full h-16"
            style={{ top: '18%' }}
            aria-hidden="true"
          >
            <motion.path
              d={RIPPLE_A}
              fill="none"
              stroke={FOAM}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.28"
              animate={{ d: [RIPPLE_A, RIPPLE_B, RIPPLE_A] }}
              transition={{ duration: SURGE_DURATION_S * 2.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
          <svg
            viewBox="0 0 1440 50"
            preserveAspectRatio="none"
            className="absolute inset-x-0 w-full h-16"
            style={{ top: '52%' }}
            aria-hidden="true"
          >
            <motion.path
              d={RIPPLE_B}
              fill="none"
              stroke={FOAM}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.18"
              animate={{ d: [RIPPLE_B, RIPPLE_A, RIPPLE_B] }}
              transition={{ duration: SURGE_DURATION_S * 1.7, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
        {/* Overlaps the body by 2px: two separately-rasterized boxes left a
            sub-pixel hairline at their shared edge. Both are TEAL_DEEP
            there, so the overlap is invisible. */}
        <div className="relative w-full flex-shrink-0" style={{ height: crestHeight, marginTop: -2 }}>
          <svg
            viewBox="0 0 1440 240"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full block"
            aria-hidden="true"
          >
            {/* The solid fill used to run its OWN independent `animate`
                tween of the same [A, B, A] keyframes as the foam stroke
                below -- two separate Framer Motion animation instances
                that LOOK identical but aren't actually locked together,
                so the teal shape and the foam line could drift out of
                phase with each other rather than tracing the same curve
                at the same instant. Now the fill has no animation of its
                own at all -- it just renders whatever curve the foam
                path (the single source of truth) reports as its live,
                in-progress `d` on every frame, via `onUpdate` below. */}
            <path d={closeAbove(crestD)} fill={TEAL_DEEP} />
            {/* Foam — an open (unclosed) stroke tracing the exact same
                curve as the teal crest above, so the highlight always
                rides right at the waterline rather than needing its own
                separately-tuned path. This is now the ONE animated path;
                the fill above just mirrors its live `d` every frame. */}
            <motion.path
              d={TEAL_CREST_A}
              fill="none"
              stroke={FOAM}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.8"
              animate={{ d: [TEAL_CREST_A, TEAL_CREST_B, TEAL_CREST_A] }}
              transition={{ duration: SURGE_DURATION_S * 0.85, repeat: Infinity, ease: 'easeInOut' }}
              onUpdate={(latest) => {
                // On an early frame, before Framer Motion's `d` interpolation
                // has produced a value, `latest.d` is briefly `undefined` —
                // setting that renders an invalid `d="undefined"` attribute
                // on the fill path below for one frame (a real console
                // error, self-corrects the next frame, but still logs).
                if (typeof latest.d === 'string') setCrestD(latest.d);
              }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
