import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, cartCount, onOpenCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItemClass = (viewName) => {
    return `transition-colors border-none bg-transparent cursor-pointer ${
      currentView === viewName
        ? 'text-terracotta-500 font-semibold cursor-default'
        : 'hover:text-terracotta-500'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-sand-100/90 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-espresso hover:text-terracotta-500 border-none outline-none focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-9 text-xs uppercase tracking-[0.2em] font-medium text-espresso-muted">
          <button
            onClick={() => setCurrentView('home')}
            className={navItemClass('home')}
          >
            Collection
          </button>
          <button
            onClick={() => setCurrentView('home')}
            className="hover:text-terracotta-500 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5"
          >
            <span>1-of-1 Artifacts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500" />
          </button>
          <button
            onClick={() => setCurrentView('commission')}
            className={navItemClass('commission')}
          >
            Custom Commissions
          </button>
          <button
            onClick={() => setCurrentView('story')}
            className={navItemClass('story')}
          >
            Our Story
          </button>
        </nav>

        {/* Brand Wordmark */}
        <div className="flex-1 lg:flex-initial text-center lg:text-left">
          <button
            onClick={() => setCurrentView('home')}
            className="group border-none bg-transparent cursor-pointer inline-block"
          >
            <span className="font-serif text-3xl sm:text-4xl tracking-widest uppercase font-normal text-espresso group-hover:text-terracotta-600 transition-colors">
              A C U A
            </span>
          </button>
        </div>

        {/* Right Header Utilities: Search & Cart */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <button 
            className="p-2 text-espresso hover:text-terracotta-500 transition-colors border-none bg-transparent"
            aria-label="Search"
          >
            <Search className="w-4 h-4 stroke-[1.75]" />
          </button>

          <button
            onClick={onOpenCart}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-cloud-sm hover:shadow-cloud transition-all border-none"
            aria-label="Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-espresso group-hover:text-terracotta-500 transition-colors stroke-[1.75]" />
            <span className="text-xs font-semibold text-espresso">
              {cartCount}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Slide-Down Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-sand-100 px-6 py-5 space-y-3 shadow-cloud"
          >
            <button
              onClick={() => { setMobileMenuOpen(false); setCurrentView('home'); }}
              className="block w-full text-left text-sm font-medium text-espresso hover:text-terracotta-500 py-1"
            >
              Collection
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); setCurrentView('home'); }}
              className="block w-full text-left text-sm font-medium text-espresso hover:text-terracotta-500 py-1"
            >
              1-of-1 Vault Artifacts
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); setCurrentView('commission'); }}
              className={`block w-full text-left text-sm font-semibold py-1 ${
                currentView === 'commission' ? 'text-terracotta-500' : 'text-espresso hover:text-terracotta-500'
              }`}
            >
              Custom Commissions
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
