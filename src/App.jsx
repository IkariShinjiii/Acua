import React, { useState } from 'react';
import CommissionView from './components/CommissionView';
import HomeView from './components/HomeView';
import Navbar from './components/Navbar';

/**
 * Root Architecture Shell
 * Supports distinct view architecture (AppView, ProductDetailView, CommissionView).
 * Currently rendering Layout 3 (CommissionView) as the initial rectification milestone.
 */
export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'commission' | 'story'
  const [cartCount, setCartCount] = useState(2);

  return (
    <div className="min-h-screen bg-sand-100 text-espresso font-sans">
      {/* Dev Navigation Quick-Switcher Bar */}
      <aside className="fixed bottom-4 right-4 z-50 bg-espresso/90 backdrop-blur-md text-white text-[11px] px-3.5 py-2 rounded-full shadow-cloud flex items-center gap-2">
        <span className="text-sand-300 font-medium">Active View:</span>
        <span className="font-semibold text-terracotta-200">{currentView === 'home' ? 'Home' : 'Commission'}</span>
      </aside>

      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        cartCount={cartCount} 
        onOpenCart={() => alert("Cart preview activated")}
      />

      {currentView === 'home' && <HomeView setCurrentView={setCurrentView} />}
      {currentView === 'commission' && <CommissionView />}
    </div>
  );
}
