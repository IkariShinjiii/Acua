import React, { useState } from 'react';
import CommissionView from './views/CommissionView';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
import Navbar from './components/Navbar';

const VIEW_LABELS = { home: 'Home', commission: 'Commission', admin: 'Admin' };

/**
 * Root Architecture Shell
 * Supports distinct view architecture (AppView, ProductDetailView, CommissionView).
 * Currently rendering Layout 3 (CommissionView) as the initial rectification milestone.
 */
export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'commission' | 'story'
  const [cartCount] = useState(2);
  // Set only via handleRequestSimilar below, so a plain nav click into the
  // Commission view never carries over a stale "inspired by" reference.
  const [commissionPrefill, setCommissionPrefill] = useState(null);

  const navigateTo = (view) => {
    setCommissionPrefill(null);
    setCurrentView(view);
  };

  const handleRequestSimilar = (item) => {
    setCommissionPrefill(item);
    setCurrentView('commission');
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1d1c16] font-sans">
      {/* Dev Navigation Quick-Switcher Bar — not a real route, just a way to
          reach AdminView until actual auth/routing exists (plan.md §4E). */}
      <aside className="fixed bottom-4 right-4 z-50 bg-[#1d1c16]/90 backdrop-blur-md text-white text-[11px] px-3.5 py-2 rounded-full shadow-cloud flex items-center gap-2">
        <span className="text-white/60 font-medium">Active View:</span>
        <span className="font-semibold text-sunset">{VIEW_LABELS[currentView]}</span>
        <span className="w-px h-3 bg-white/20" />
        <button
          onClick={() => navigateTo(currentView === 'admin' ? 'home' : 'admin')}
          className="text-white/60 hover:text-sunset transition-colors border-none bg-transparent cursor-pointer font-medium underline underline-offset-2"
        >
          {currentView === 'admin' ? 'Exit Admin' : 'Admin'}
        </button>
      </aside>

      <Navbar
        currentView={currentView}
        setCurrentView={navigateTo}
        cartCount={cartCount}
        onOpenCart={() => alert("Cart preview activated")}
      />

      {currentView === 'home' && (
        <HomeView setCurrentView={navigateTo} onRequestSimilar={handleRequestSimilar} />
      )}
      {currentView === 'commission' && <CommissionView prefill={commissionPrefill} />}
      {currentView === 'admin' && <AdminView />}
    </div>
  );
}
