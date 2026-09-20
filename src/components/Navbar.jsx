import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, cartCount = 2, onOpenCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F9F6F0]/95 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(38,28,20,0.04)] py-3'
          : 'bg-[#F9F6F0]/85 backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Left: Editorial Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer ${
                currentView === 'home'
                  ? 'text-[#9B3B1C] font-semibold'
                  : 'text-[#57423b] hover:text-[#9B3B1C]'
              }`}
            >
              Shop
              {currentView === 'home' && (
                <motion.div
                  layoutId="activeNavIndicatorVite"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#9B3B1C] rounded-full"
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
              className="text-xs uppercase tracking-[0.2em] transition-colors py-1 font-medium text-[#57423b] hover:text-[#9B3B1C] bg-transparent border-none cursor-pointer"
            >
              Collections
            </button>

            <button
              onClick={() => setCurrentView('commission')}
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer ${
                currentView === 'commission'
                  ? 'text-[#9B3B1C] font-semibold'
                  : 'text-[#57423b] hover:text-[#9B3B1C]'
              }`}
            >
              Custom Request
              {currentView === 'commission' && (
                <motion.div
                  layoutId="activeNavIndicatorVite"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#9B3B1C] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1d1c16] hover:text-[#9B3B1C] transition-colors focus:outline-none border-none bg-transparent"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[1.5]" />
              )}
            </button>
          </div>

          {/* Center: Serif Brand Wordmark */}
          <div className="flex-1 md:flex-initial text-center">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block group focus:outline-none bg-transparent border-none cursor-pointer"
              aria-label="ACUA Home"
            >
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-[0.24em] uppercase font-normal text-[#1d1c16] group-hover:text-[#9B3B1C] transition-colors duration-300">
                ACUA
              </span>
            </button>
          </div>

          {/* Right: Action Utilities (Search, Cart, Profile) */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={() => alert("Search catalog")}
              className="p-2 text-[#1d1c16] hover:text-[#9B3B1C] transition-colors duration-200 focus:outline-none border-none bg-transparent cursor-pointer"
              aria-label="Search Catalog"
            >
              <Search className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>

            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#1d1c16] hover:text-[#9B3B1C] transition-colors duration-200 focus:outline-none group border-none bg-transparent cursor-pointer"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-[18px] h-[18px] stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[15px] h-[15px] px-1 bg-[#9B3B1C] text-white text-[9px] font-medium rounded-full flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="hidden sm:block p-2 text-[#1d1c16] hover:text-[#9B3B1C] transition-colors duration-200 focus:outline-none border-none bg-transparent cursor-pointer"
              aria-label="Account Profile"
            >
              <User className="w-[18px] h-[18px] stroke-[1.5]" />
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
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-[#9B3B1C] bg-transparent border-none"
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
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-[#9B3B1C] bg-transparent border-none"
              >
                Collections
              </button>
              <button
                onClick={() => {
                  setCurrentView('commission');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-[#1d1c16] hover:text-[#9B3B1C] bg-transparent border-none"
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
