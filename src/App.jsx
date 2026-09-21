import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import CommissionView from './views/CommissionView';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import { useAuth } from './context/AuthContext';

const VIEW_LABELS = { home: 'Home', commission: 'Commission', admin: 'Admin' };

// Real gate: only a signed-in account with profiles.is_admin = true sees
// AdminView. Accounts are provisioned by hand (Supabase dashboard + a SQL
// UPDATE), never self-signup — so this form is login-only.
function AdminGate() {
  const { user, isAdmin, loading, profileLoading, signOut } = useAuth();

  if (loading || (user && profileLoading)) {
    return <div className="pt-40 text-center text-sm text-[#57423b]">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <AuthForm allowSignup={false} title="Admin Login" subtitle="Restricted to ACUA staff." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24 text-center space-y-4">
        <p className="text-sm text-[#57423b]">
          Signed in as <strong className="text-[#1d1c16]">{user.email}</strong>, but this account
          isn't an admin.
        </p>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-chile-rojo hover:text-terracota transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Log out
        </button>
      </div>
    );
  }

  return <AdminView />;
}

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
  const { user, signOut } = useAuth();

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
          reach the (now real-auth-gated) AdminView until real routing exists. */}
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
        {user && (
          <>
            <span className="w-px h-3 bg-white/20" />
            <button
              onClick={signOut}
              className="text-white/60 hover:text-sunset transition-colors border-none bg-transparent cursor-pointer font-medium underline underline-offset-2"
              title={user.email}
            >
              Log out
            </button>
          </>
        )}
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
      {currentView === 'admin' && <AdminGate />}
    </div>
  );
}
