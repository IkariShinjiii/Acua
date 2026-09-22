import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import HomeView from './views/HomeView';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import CartDrawer from './components/CartDrawer';
import SearchOverlay from './components/SearchOverlay';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

// Split out of the main bundle: every visitor lands on Home first (the
// default view), so only it needs to be in the initial bundle — every
// other view is either behind a login/admin check most visitors never
// pass, or (Commission, product detail) just isn't needed until they
// actually navigate there.
const AdminView = lazy(() => import('./views/AdminView'));
const PatronDashboardView = lazy(() => import('./views/PatronDashboardView'));
const CommissionView = lazy(() => import('./views/CommissionView'));
const ProductDetailView = lazy(() => import('./views/ProductDetailView'));
// Not on the critical path — most visitors never open it, and it has no
// loading state worth showing (it just pops in once ready).
const ConciergeChat = lazy(() => import('./components/ConciergeChat'));

// The plain "Loading…" text this replaced was easy to miss entirely — no
// motion, no visual acknowledgment that the tap registered — and on a slow
// connection (a lazy view's JS chunk still has to download) it could sit on
// screen for seconds with nothing to signal progress. The fade-in means it
// reads as an intentional transition whether it's up for 50ms or 3s, rather
// than a flash of unstyled text.
// min-h-screen matches the root wrapper every one of the four lazy views
// (Commission, product detail, admin, patron dashboard) uses for itself —
// a shorter fallback here would leave the Footer (rendered as a fixed
// sibling below, not inside this Suspense boundary) with far less page
// above it during loading than once the real view mounts, so it would
// visibly jump up and then back down on every single transition.
const ViewLoadingFallback = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24"
  >
    <div className="w-9 h-9 rounded-full border-[3px] border-chile-rojo/15 border-t-chile-rojo animate-spin" />
    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Loading…</span>
  </motion.div>
);

const DEFAULT_TITLE = 'ACUA | Handcrafted by the Coast';
// Every other view gets its own tab title so multiple tabs/history entries
// are distinguishable — 'product' is deliberately left out here since
// ProductDetailView overrides it with the actual piece's name once loaded;
// 'dashboard' is handled separately below since which title is right
// depends on whether that account turns out to be an admin.
const DOCUMENT_TITLES = {
  commission: 'Custom Request | ACUA',
  dashboard: 'My Account | ACUA',
};

// The one login gate for every account — "My Account" and "Admin Login"
// used to be two separate screens (reachable only via a dev-only nav
// widget, since there's no real router to give admin its own URL), which
// meant signing in as staff and signing in as a patron were confusingly
// different flows for what's otherwise the exact same form. Now anyone
// signs in here, and what they see next depends on their own account:
// profiles.is_admin = true (set by hand in Supabase, never self-service)
// gets the admin dashboard, everyone else gets their own orders/
// commissions.
function AccountGate({ setCurrentView, initialTab }) {
  const { user, isAdmin, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return <div className="pt-40 text-center text-sm text-on-surface-variant">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <AuthForm title="My Account" subtitle="Log in or create an account to track your orders and commissions." />
      </div>
    );
  }

  if (isAdmin) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <AdminView />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <PatronDashboardView setCurrentView={setCurrentView} initialTab={initialTab} />
    </Suspense>
  );
}

// Takes over the whole screen once Supabase parses a password-recovery link
// from the URL — the visitor just followed a "reset your password" email
// and should set a new one before doing anything else, regardless of
// whatever view they'd otherwise land on (there's no router to send them to
// a dedicated /reset-password path instead).
function ResetPasswordGate() {
  const { updatePassword, clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {done ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-olive/15 text-olive flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl text-on-surface">Password updated</h2>
            <p className="text-sm text-on-surface-variant">You're all set — continue with your new password.</p>
            <button onClick={clearPasswordRecovery} className="btn-terracotta w-full justify-center">
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl text-on-surface">Set a New Password</h2>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Choose a new password for your account.
              </p>
            </div>
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cloud-input"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="cloud-input"
            />
            {error && (
              <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-terracotta w-full justify-center">
              {submitting ? 'Saving…' : 'Save New Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearPasswordRecovery();
                signOut();
              }}
              className="block mx-auto text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-accent transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
            >
              Cancel and log out
            </button>
          </form>
        )}
      </div>
    </div>
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
  // Set only via goToDashboardTab below, and reset on any other
  // navigation — same "don't carry over a stale deep-link" rule as
  // commissionPrefill, just for which patron-dashboard tab opens first.
  const [dashboardInitialTab, setDashboardInitialTab] = useState(undefined);
  const { isAdmin, passwordRecovery } = useAuth();
  const { count: cartCount } = useCart();

  // Whether 'dashboard' is currently showing the admin tools rather than
  // a patron's own orders/commissions — there's no separate 'admin' view
  // to check anymore now that AccountGate decides based on the signed-in
  // account, so anything that used to key off currentView === 'admin'
  // (the tab title, hiding the footer/concierge) checks this instead.
  const showingAdmin = currentView === 'dashboard' && isAdmin;

  useEffect(() => {
    if (currentView === 'product') return; // ProductDetailView sets its own once loaded
    if (showingAdmin) {
      document.title = 'Admin | ACUA';
      return;
    }
    document.title = DOCUMENT_TITLES[currentView] ?? DEFAULT_TITLE;
  }, [currentView, showingAdmin]);

  if (passwordRecovery) {
    return <ResetPasswordGate />;
  }

  const navigateTo = (view) => {
    setCommissionPrefill(null);
    setDashboardInitialTab(undefined);
    setCurrentView(view);
  };

  const handleRequestSimilar = (item) => {
    setCommissionPrefill(item);
    setCurrentView('commission');
  };

  const goToDashboardTab = (tab) => {
    setCommissionPrefill(null);
    setDashboardInitialTab(tab);
    setCurrentView('dashboard');
  };

  const handleViewProduct = (productId) => {
    setSelectedProductId(productId);
    setCurrentView('product');
  };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans">
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
      {currentView === 'commission' && (
        <Suspense fallback={<ViewLoadingFallback />}>
          <CommissionView prefill={commissionPrefill} />
        </Suspense>
      )}
      {currentView === 'dashboard' && (
        <AccountGate setCurrentView={navigateTo} initialTab={dashboardInitialTab} />
      )}
      {currentView === 'product' && (
        <Suspense fallback={<ViewLoadingFallback />}>
          <ProductDetailView
            productId={selectedProductId}
            setCurrentView={navigateTo}
            onRequestSimilar={handleRequestSimilar}
          />
        </Suspense>
      )}

      {/* Shared across every storefront-facing view — not the admin
          dashboard, which (like most internal business tools) doesn't
          carry the public marketing footer. */}
      {!showingAdmin && (
        <Footer setCurrentView={navigateTo} onTrackCommission={() => goToDashboardTab('commissions')} />
      )}

      {/* Same reasoning as the footer — a customer-facing concierge has
          no place in the internal admin tool. */}
      {!showingAdmin && (
        <Suspense fallback={null}>
          <ConciergeChat />
        </Suspense>
      )}
    </div>
  );
}
