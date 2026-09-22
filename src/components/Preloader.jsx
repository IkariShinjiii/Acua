import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import logoMarkOlive from '../assets/logo-mark-olive.png';

// EXPERIMENTAL — built on its own branch for the owner to look at before
// this goes anywhere near main. A subtle wave band loops continuously
// from the top of the screen to the bottom behind the centered logo mark
// while the page actually loads, then the whole screen fades out.
//
// "Ready" is a minimum display time (so a fast load doesn't just flash
// once and feel glitchy) AND the window 'load' event (fonts/images),
// whichever finishes later — a slow first load never gets cut short, but
// nothing lingers once everything real is already visible either.
const MIN_DISPLAY_MS = 1400;
const FADE_DURATION_S = 0.4;

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

// One wave shape, drawn twice back-to-back inside a viewBox sized to fit
// both copies exactly. Translating the pair by precisely one copy's own
// height (-50% of the whole, since it's two copies stacked) always lands
// on a frame that looks identical to the start — the standard trick for
// an infinitely-scrolling background with no visible "snap" at the loop
// point, which a single non-repeating shape can't do.
const WAVE_PATH = 'M0,50 C240,110 480,0 720,50 C960,100 1200,10 1440,60 L1440,150 L0,150 Z';

export default function Preloader() {
  const [phase, setPhase] = useState('visible'); // 'visible' | 'leaving' | 'done'

  useEffect(() => {
    let cancelled = false;
    Promise.all([waitForWindowLoad(), new Promise((r) => setTimeout(r, MIN_DISPLAY_MS))]).then(() => {
      if (!cancelled) setPhase('leaving');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-sand overflow-hidden flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'leaving' ? 0 : 1 }}
      transition={{ duration: FADE_DURATION_S, ease: 'easeInOut' }}
      // Framer Motion fires this on every completed transition, including
      // the (no-op, zero-visible-change) very first one on mount — the
      // phase guard is what makes only the real fade-out trigger the
      // unmount below.
      onAnimationComplete={() => {
        if (phase === 'leaving') setPhase('done');
      }}
    >
      <motion.svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 w-full text-olive/[0.14] pointer-events-none"
        style={{ height: '200%' }}
        animate={{ y: ['-50%', '0%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      >
        <path d={WAVE_PATH} fill="currentColor" />
        <path d={WAVE_PATH} transform="translate(0, 150)" fill="currentColor" />
      </motion.svg>

      <motion.img
        src={logoMarkOlive}
        alt=""
        className="w-14 h-14 sm:w-16 sm:h-16 relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
