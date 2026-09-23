import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import logoMarkOlive from '../assets/logo-mark-olive.png';

// EXPERIMENTAL — built on its own branch for the owner to look at before
// this goes anywhere near main. A translucent wave rises from the top of
// the screen and grows downward until it engulfs the whole viewport —
// including passing directly over the centered logo, which stays faintly
// visible through the wave's own translucency rather than being hidden
// once covered. Once the wave has fully engulfed the screen, that's the
// "loading is finished" moment, and the whole thing fades out to reveal
// the real page underneath.
//
// The fade-out itself still waits on *real* readiness — a minimum display
// time (so a fast load doesn't just flash once and feel glitchy) AND the
// window 'load' event (fonts/images), whichever finishes later — so if
// the real page takes longer than the fill animation, the screen just
// holds fully engulfed (logo dimly visible) rather than fading out on a
// half-loaded page.
const MIN_DISPLAY_MS = 1400;
const FILL_DURATION_S = 1.1;
const FADE_DURATION_S = 0.4;

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

// The wave's own wavy edge is drawn at the TOP of this band (dips and
// rises across y=0-90), with a solid fill below it down to y=120 — this
// band sits at the trailing/bottom edge of the growing fill below, so its
// wavy top is always exactly where "covered" currently ends and "not yet
// covered" begins.
const WAVE_PATH = 'M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,50 L1440,120 L0,120 Z';

export default function Preloader() {
  const [filled, setFilled] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([waitForWindowLoad(), new Promise((r) => setTimeout(r, MIN_DISPLAY_MS))]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fades out once BOTH the wave has actually finished engulfing the
  // screen AND the real page is ready — whichever of the two finishes
  // last, so neither a fast page load nor a fast fill animation cuts the
  // other short.
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
      // Framer Motion fires this on every completed transition, including
      // the (no-op, zero-visible-change) very first one on mount — the
      // `leaving` guard is what makes only the real fade-out trigger the
      // unmount below.
      onAnimationComplete={() => {
        if (leaving) setDone(true);
      }}
    >
      {/* The page-colored floor — matches whatever the real background
          will be, so anything the rising wave hasn't reached yet already
          looks like the real page rather than a flash of blank color. */}
      <div className="absolute inset-0 bg-sand" />

      {/* The logo sits BELOW the wave fill in stacking order, so the
          fill's own translucency is what dims it once the wave passes
          over — not hidden, just faint underneath. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoMarkOlive} alt="" className="w-14 h-14 sm:w-16 sm:h-16" />
      </div>

      {/* The rising wave fill itself — anchored to the top edge, growing
          taller until it reaches the full viewport height. Its own
          overflow-hidden keeps the wave band clipped to exactly the
          currently-filled height at every frame, rather than rendering
          past it during the early, still-short frames of the growth. */}
      <motion.div
        className="absolute inset-x-0 top-0 flex flex-col overflow-hidden"
        initial={{ height: 0 }}
        animate={{ height: '100vh' }}
        transition={{ duration: FILL_DURATION_S, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => setFilled(true)}
      >
        <div className="flex-1 bg-olive/80" />
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="w-full h-[80px] sm:h-[120px] block flex-shrink-0 text-olive/80"
          aria-hidden="true"
        >
          <path d={WAVE_PATH} fill="currentColor" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
