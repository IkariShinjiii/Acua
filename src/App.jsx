import React, { useState, Suspense, lazy } from 'react';
import { LogOut } from 'lucide-react';
import CommissionView from './views/CommissionView';
import HomeView from './views/HomeView';
import ProductDetailView from './views/ProductDetailView';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import CartDrawer from './components/CartDrawer';
import SearchOverlay from './components/SearchOverlay';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

// Split out of the main bundle: every anonymous storefront visitor pays for
// these otherwise, despite being gated behind a login/admin check that most
// of them never pass.
const AdminView = lazy(() => import('./views/AdminView'));
const PatronDashboardView = lazy(() => import('./views/PatronDashboardView'));

const ViewLoadingFallback = () => (
  <div className="pt-40 text-center text-sm text-on-surface-variant">Loading…</div>
);

const VIEW_LABELS = {
  home: 'Home',
  commission: 'Commission',
  admin: 'Admin',
  dashboard: 'Dashboard',
  product: 'Product',
};

// Real gate: only a signed-in account with profiles.is_admin = true sees
// AdminView. Accounts are provisioned by hand (Supabase dashboard + a SQL
// UPDATE), never self-signup — so this form is login-only.
function AdminGate() {
  const { user, isAdmin, loading, profileLoading, signOut } = useAuth();

  if (loading || (user && profileLoading)) {
    return <div className="pt-40 text-center text-sm text-on-surface-variant">Checking access…</div>;
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
        <p className="text-sm text-on-surface-variant">
          Signed in as <strong className="text-on-surface">{user.email}</strong>, but this account
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

  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <AdminView />
    </Suspense>
  );
}

// Real gate: any signed-in account (signup allowed, unlike the admin gate).
function PatronGate({ setCurrentView }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="pt-40 text-center text-sm text-on-surface-variant">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <AuthForm title="My Account" subtitle="Log in or create an account to track your orders and commissions." />
      </div>
    );
  }

  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <PatronDashboardView setCurrentView={setCurrentView} />
    </Suspense>
  );
}

/**
 * Root Architecture Shell
 * Supports distinct view architecture (AppView, ProductDetailView, CommissionView).
 * Currently rendering Layout 3 (CommissionView) as the initial rectification milestone.
 */
export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'commission' | 'story'
  // Set only via handleRequestSimilar below, so a plain nav click into the
  // Commission view never carries over a stale "inspired by" reference.
  const [commissionPrefill, setCommissionPrefill] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { count: cartCount } = useCart();

  const navigateTo = (view) => {
    setCommissionPrefill(null);
    setCurrentView(view);
  };

  const handleRequestSimilar = (item) => {
    setCommissionPrefill(item);
    setCurrentView('commission');
  };

  const handleViewProduct = (productId) => {
    setSelectedProductId(productId);
    setCurrentView('product');
  };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans">
      {/* Dev Navigation Quick-Switcher Bar — not a real route, just a way to
          reach the (now real-auth-gated) AdminView until real routing exists. */}
      <aside className="fixed bottom-4 right-4 z-50 bg-on-surface/90 backdrop-blur-md text-white text-[11px] px-3.5 py-2 rounded-full shadow-cloud flex items-center gap-2">
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
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onAccountClick={() => navigateTo('dashboard')}
      />

      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onViewProduct={handleViewProduct}
      />
      <SearchOverlay
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleViewProduct}
      />

      {currentView === 'home' && (
        <HomeView
          setCurrentView={navigateTo}
          onRequestSimilar={handleRequestSimilar}
          onViewProduct={handleViewProduct}
        />
      )}
      {currentView === 'commission' && <CommissionView prefill={commissionPrefill} />}
      {currentView === 'admin' && <AdminGate />}
      {currentView === 'dashboard' && <PatronGate setCurrentView={navigateTo} />}
      {currentView === 'product' && (
        <ProductDetailView
          productId={selectedProductId}
          setCurrentView={navigateTo}
          onRequestSimilar={handleRequestSimilar}
        />
      )}
    </div>
  );
}
