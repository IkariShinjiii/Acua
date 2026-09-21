import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ currentView, setCurrentView, cartCount = 2, onOpenCart, onOpenSearch, onAccountClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Translucent over the hero image (home, unscrolled); solid everywhere
  // else — including while the mobile drawer is open, so the header
  // doesn't sit as a translucent strip of hero photo directly above the
  // drawer's own solid panel. It reverts to translucent as soon as the
  // drawer closes (still on an unscrolled home view).
  const isTransparent = currentView === 'home' && !isScrolled && !mobileMenuOpen;
  const textBase = isTransparent ? 'text-white/85' : 'text-on-surface-variant';
  const textStrong = isTransparent ? 'text-white' : 'text-on-surface';
  const accent = isTransparent ? 'text-sunset' : 'text-accent';
  const accentHover = isTransparent ? 'hover:text-sunset' : 'hover:text-accent';
  const accentBar = isTransparent ? 'bg-sunset' : 'bg-chile-rojo';
  const groupAccentHover = isTransparent ? 'group-hover:text-sunset' : 'group-hover:text-accent';
  // Transparent state sits over the fixed-dark hero photo (bg-ink, same
  // fix as HomeView's scrim) — not the theme-aware surface, which would
  // put a near-white ring offset over the photo in dark mode.
  const ringOffset = isTransparent ? 'focus-visible:ring-offset-ink' : 'focus-visible:ring-offset-sand';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-500 ${
        isTransparent
          ? 'bg-transparent py-6'
          : 'bg-sand/95 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(38,28,20,0.04)] py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Left: Serif Brand Wordmark */}
          <button
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`group flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full bg-transparent border-none cursor-pointer`}
            aria-label="ACUA Home"
          >
            {/* TODO: swap for the exported ACUA icon mark once provided (transparent PNG/SVG) */}
            <span className={`font-serif text-2xl sm:text-3xl tracking-[0.24em] uppercase font-normal transition-colors duration-300 ${textStrong} ${groupAccentHover}`}>
              ACUA
            </span>
          </button>

          {/* Center: Editorial Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer ${
                currentView === 'home' ? `${accent} font-semibold` : `${textBase} ${accentHover}`
              }`}
            >
              Shop
              {currentView === 'home' && (
                <motion.div
                  layoutId="activeNavIndicatorVite"
                  className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${accentBar}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => {
                setCurrentView('home');
                const el = document.getElementById('available-pieces');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-xs uppercase tracking-[0.2em] transition-colors py-1 font-medium bg-transparent border-none cursor-pointer ${textBase} ${accentHover}`}
            >
              Collections
            </button>

            <button
              onClick={() => setCurrentView('commission')}
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer ${
                currentView === 'commission' ? `${accent} font-semibold` : `${textBase} ${accentHover}`
              }`}
            >
              Custom Request
              {currentView === 'commission' && (
                <motion.div
                  layoutId="activeNavIndicatorVite"
                  className={`absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full ${accentBar}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>

          {/* Right: Action Utilities (Search, Cart, Profile) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onOpenSearch}
              className={`hidden md:inline-flex p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label="Search Catalog"
            >
              <Search className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>

            <button
              onClick={onOpenCart}
              className={`relative p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full group border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-[18px] h-[18px] stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[15px] h-[15px] px-1 bg-chile-rojo text-white text-[9px] font-medium rounded-full flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onAccountClick}
              className={`hidden md:inline-flex p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label="Account Profile"
            >
              <User className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>

            <button
              onClick={toggleTheme}
              className={`inline-flex p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] stroke-[1.5]" />
              ) : (
                <Moon className="w-[18px] h-[18px] stroke-[1.5]" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent ${textStrong} ${accentHover}`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[1.5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-sand border-b border-outline-variant/30 px-6 py-6 shadow-lg"
          >
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none"
              >
                Shop
              </button>
              <button
                onClick={() => {
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                  const el = document.getElementById('available-pieces');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none"
              >
                Collections
              </button>
              <button
                onClick={() => {
                  setCurrentView('commission');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none"
              >
                Custom Request
              </button>

              {/* Search and Account only ever appeared as desktop-only icons
                  in the header (hidden md:inline-flex) — with nothing else
                  reachable on mobile, there was no way to search or log in
                  on a phone at all. */}
              <div className="pt-2 border-t border-outline-variant/30 flex flex-col space-y-4">
                <button
                  onClick={() => {
                    onOpenSearch?.();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none"
                >
                  <Search className="w-4 h-4 stroke-[1.5]" />
                  Search
                </button>
                <button
                  onClick={() => {
                    onAccountClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none"
                >
                  <User className="w-4 h-4 stroke-[1.5]" />
                  My Account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
