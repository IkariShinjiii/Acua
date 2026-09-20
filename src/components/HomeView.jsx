import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ProductCarousel from './ProductCarousel';

export default function HomeView({ setCurrentView }) {
  return (
    <div className="min-h-screen bg-sand-100 text-espresso font-sans antialiased relative selection:bg-terracotta-100 selection:text-terracotta-700">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pb-32">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-32 relative">
          
          {/* Radial glow behind hero */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-ochre-light/20 via-terracotta-100/10 to-transparent blur-3xl pointer-events-none -z-10" />

          {/* Text Content */}
          <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.1] text-espresso font-normal">
                Sculpted by earth,
                <span className="block italic text-terracotta-700 mt-2">heirloom by design.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="text-base sm:text-lg text-espresso-muted max-w-lg mx-auto lg:mx-0 font-sans leading-relaxed"
            >
              Discover our latest collection of molten recycled metals and raw oceanic pearls. Singular artifacts crafted for modern permanence.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <button 
                onClick={() => {
                  const carousel = document.getElementById('collection-carousel');
                  carousel?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-terracotta w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  Explore Collection
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </span>
              </button>
              
              <button 
                onClick={() => setCurrentView('commission')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-sand-200/50 hover:bg-white text-espresso font-semibold text-sm tracking-wide shadow-input-inset hover:shadow-cloud transition-all duration-300 border-none"
              >
                Custom Commissions
              </button>
            </motion.div>
          </div>

          {/* Hero Featured Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 relative w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-cloud-lg transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <img 
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80" 
                alt="Featured Tidal Baroque Pearl Choker"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] uppercase tracking-widest font-semibold mb-3">
                  Featured Artifact
                </span>
                <h3 className="font-serif text-2xl font-medium">Tidal Baroque Pearl</h3>
              </div>
            </div>
            {/* Decorative organic shapes */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-ochre-light/40 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-terracotta-200/40 rounded-full blur-2xl -z-10" />
          </motion.div>
        </div>

        {/* Product Carousel Section */}
        <div id="collection-carousel">
          <ProductCarousel onAddToCart={() => {}} />
        </div>

      </main>
      
      {/* ATELIER FOOTER */}
      <footer className="bg-sand-200/50 border-none py-12 text-center text-xs text-espresso-muted mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif text-base tracking-widest text-espresso uppercase">
            A C U A &nbsp; A T E L I E R
          </p>
          <p>© {new Date().getFullYear()} ACUA Artisanal Jewelry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
