import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import logoMarkOlive from '../assets/logo-mark-olive.png';

// EXPERIMENTAL — built on its own branch for the owner to look at before
// this goes anywhere near main. Two layered, translucent teal "water"
// shapes rise from the top of the screen and grow until they engulf the
// whole viewport — including the logo, which stays faintly visible
// through the water's own translucency rather than being hidden once
// covered. Colors (a pale blue-gray + a saturated teal, per a reference
// the owner shared) are scoped to this file alone via arbitrary Tailwind
// values, not added to the shared palette — nothing else on the site
// uses blue/teal, and this is still an experiment, not a decided brand
// addition. Once the water has fully engulfed the screen (and the real
// page is actually ready), the whole thing fades out to reveal the page.
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

const PALE_WATER = '#D8E7E3';
const TEAL_WATER = '#3AA98D';
const ACCENT_LINE = '#1F6355';

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

// Irregular, asymmetric humps (not a single repeating sine) so the edge
// reads as organic water rather than a mechanical wave pattern — matching
// the reference's hand-drawn, blobby coastline look. The pale path has
// taller peaks than the teal one directly beneath it, so it peeks up
// behind the teal water at each crest, the same layered-depth look the
// reference uses.
const PALE_WAVE_PATH =
  'M0,60 C120,20 260,90 380,50 C520,5 640,80 760,45 C900,15 1020,70 1160,40 C1280,15 1360,55 1440,35 L1440,140 L0,140 Z';
const TEAL_WAVE_PATH =
  'M0,85 C130,55 250,100 390,75 C530,45 650,95 770,70 C910,50 1030,90 1170,65 C1290,50 1370,80 1440,68 L1440,140 L0,140 Z';
// A thin highlight riding just inside the teal crest — the reference's own
// small dark accent squiggle within the main water shape.
const ACCENT_LINE_PATH = 'M130,60 C210,80 260,50 340,68 C400,80 440,60 500,70';

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

  // Fades out once BOTH the water has actually finished engulfing the
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

      {/* The rising water fill — anchored to the top edge, growing taller
          until it reaches the full viewport height. Its own
          overflow-hidden keeps the wave band clipped to exactly the
          currently-filled height at every frame. */}
      <motion.div
        className="absolute inset-x-0 top-0 flex flex-col overflow-hidden"
        initial={{ height: 0 }}
        animate={{ height: '100vh' }}
        transition={{ duration: FILL_DURATION_S, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => setFilled(true)}
      >
        <div className="flex-1" style={{ backgroundColor: TEAL_WATER, opacity: 0.82 }} />
        <div className="relative w-full h-[100px] sm:h-[140px] flex-shrink-0" style={{ opacity: 0.82 }}>
          <svg
            viewBox="0 0 1440 140"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full block"
            aria-hidden="true"
          >
            <path d={PALE_WAVE_PATH} fill={PALE_WATER} />
            <path d={TEAL_WAVE_PATH} fill={TEAL_WATER} />
            <path
              d={ACCENT_LINE_PATH}
              fill="none"
              stroke={ACCENT_LINE}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}
