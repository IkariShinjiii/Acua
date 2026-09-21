import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, cartCount = 2, onOpenCart, onAccountClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Translucent over the hero image (home, unscrolled); solid everywhere else.
  const isTransparent = currentView === 'home' && !isScrolled;
  const textBase = isTransparent ? 'text-white/85' : 'text-[#57423b]';
  const textStrong = isTransparent ? 'text-white' : 'text-[#1d1c16]';
  const accent = isTransparent ? 'text-sunset' : 'text-chile-rojo';
  const accentHover = isTransparent ? 'hover:text-sunset' : 'hover:text-chile-rojo';
  const accentBar = isTransparent ? 'bg-sunset' : 'bg-chile-rojo';
  const groupAccentHover = isTransparent ? 'group-hover:text-sunset' : 'group-hover:text-chile-rojo';
  const ringOffset = isTransparent ? 'focus-visible:ring-offset-[#1d1c16]' : 'focus-visible:ring-offset-[#F9F6F0]';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-500 ${
        isTransparent
          ? 'bg-transparent py-6'
          : 'bg-[#F9F6F0]/95 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(38,28,20,0.04)] py-3'
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
              onClick={() => alert("Search catalog")}
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
            className="md:hidden bg-[#F9F6F0] border-b border-[#dec0b7]/30 px-6 py-6 shadow-lg"
          >
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-chile-rojo bg-transparent border-none"
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
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-chile-rojo bg-transparent border-none"
              >
                Collections
              </button>
              <button
                onClick={() => {
                  setCurrentView('commission');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-chile-rojo bg-transparent border-none"
              >
                Custom Request
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
