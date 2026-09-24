import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import HomeView from './views/HomeView';
import Navbar from './components/Navbar';
import AuthForm from './components/AuthForm';
import CartDrawer from './components/CartDrawer';
import SearchOverlay from './components/SearchOverlay';
import SettingsOverlay from './components/SettingsOverlay';
import Toast, { useToast } from './components/Toast';
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
const FAQView = lazy(() => import('./views/FAQView'));
const LegalView = lazy(() => import('./views/LegalView'));
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
  faq: 'FAQ | ACUA',
  privacy: 'Privacy Policy | ACUA',
  terms: 'Terms of Service | ACUA',
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
  const { user, isAdmin, loading, profileLoading, profileFailed, retryProfile } = useAuth();

  if (loading || (user && profileLoading)) {
    return <div className="pt-40 text-center text-sm text-on-surface-variant">Checking access…</div>;
  }

  // isAdmin derives entirely from the profile row this failed to fetch —
  // falling through to the isAdmin check below would show a genuine admin
  // hitting a transient connection issue their own regular patron
  // dashboard, with nothing telling them anything went wrong. Blocking
  // here and asking to retry is the same "don't guess" call this session
  // made for every other spot a fetch failure used to look like something
  // else (see plan.md), just applied to access control instead of content.
  if (user && profileFailed) {
    return (
      <div className="flex flex-col items-center gap-3 pt-40 pb-24 text-center px-4">
        <AlertCircle className="w-5 h-5 text-accent" />
        <p className="text-sm text-on-surface-variant max-w-sm">
          Couldn't verify your account right now — this is a connection issue on our end, not a
          sign anything's wrong with it.
        </p>
        <button
          onClick={retryProfile}
          className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          Try Again
        </button>
      </div>
    );
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
        <AdminView initialTab={initialTab} />
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
// A shared product link (/?product=<id>, from the product page's Share
// button) opens straight to that piece.
function productIdFromUrl() {
  return new URLSearchParams(window.location.search).get('product');
}

// Views with their own real path (linkable, e.g. from PayMongo's merchant
// application or the sign-up form); vercel.json rewrites them to index.html.
// Every other view lives on /.
const VIEW_PATHS = { privacy: '/privacy', terms: '/terms' };
function viewFromPath() {
  return Object.keys(VIEW_PATHS).find((view) => VIEW_PATHS[view] === window.location.pathname);
}

// Scrolls back to where a Back/Forward entry was left, once the restored
// view has rendered tall enough. Home is the slow case: it locks scrolling
// under its own splash and fills in as its data arrives. Gives up after 3s
// and scrolls as far as it can.
function restoreScroll(y) {
  const deadline = Date.now() + 3000;
  const attempt = () => {
    const locked = document.documentElement.style.overflow === 'hidden';
    const reachable = document.documentElement.scrollHeight - window.innerHeight >= y;
    if ((!locked && reachable) || Date.now() > deadline) {
      window.scrollTo({ top: y, behavior: 'instant' });
      return;
    }
    setTimeout(attempt, 50);
  };
  setTimeout(attempt, 0);
}

export default function App() {
  const [currentView, setCurrentView] = useState(() => (productIdFromUrl() ? 'product' : viewFromPath() ?? 'home'));
  // Set only via handleRequestSimilar below, so a plain nav click into the
  // Commission view never carries over a stale "inspired by" reference.
  const [commissionPrefill, setCommissionPrefill] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(productIdFromUrl);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Set only via goToDashboardTab below, and reset on any other
  // navigation — same "don't carry over a stale deep-link" rule as
  // commissionPrefill, just for which patron-dashboard tab opens first.
  const [dashboardInitialTab, setDashboardInitialTab] = useState(undefined);
  // Only ever incremented, never read for its own value — see the comment
  // on goToDashboardTab below for why this exists.
  const dashboardTabRequestIdRef = useRef(0);
  const { isAdmin, passwordRecovery } = useAuth();
  const { count: cartCount } = useCart();
  const { toast, showToast, dismissToast } = useToast();

  // signInWithOAuth (AuthContext.signInWithGoogle) redirects straight to
  // Supabase's own /authorize endpoint rather than resolving in-page — a
  // failure *after* that redirect (the visitor denies consent, or Google/
  // Supabase can't complete it) comes back here as an "#error=...&error_
  // description=..." fragment, not a normal in-app error path. Without
  // this, that failure was completely invisible: the button just looked
  // like it silently did nothing, with a stray #error fragment left
  // sitting in the address bar.
  useEffect(() => {
    if (!window.location.hash.includes('error=')) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const description = params.get('error_description');
    showToast(
      description ? description.replace(/\+/g, ' ') : "Google sign-in didn't go through. Please try again.",
      'error'
    );
    // Keeps the entry's in-app navigation state (see the history effects below).
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Browser history for in-app navigation. There's no router, so each view
  // change pushes an entry carrying { acuaView, productId }, and the phone's
  // Back/Forward (popstate) restore the view from it — before this, Back
  // from any page left the site entirely. Leaving an entry records its
  // scroll position so Back returns to the same spot. Only product pages
  // change the visible URL (/?product=<id>, so a copied link is shareable);
  // every other view stays on /.
  const lastScrollYRef = useRef(0);
  const historyInitializedRef = useRef(false);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    // Read by the push below: by the time that effect runs, the new view
    // has committed and the page may already have been clamped shorter.
    const onScroll = () => {
      lastScrollYRef.current = window.scrollY;
    };
    const onPopState = (e) => {
      const fromUrl = productIdFromUrl();
      const entry = e.state?.acuaView
        ? e.state
        : { acuaView: fromUrl ? 'product' : viewFromPath() ?? 'home', productId: fromUrl };
      setCommissionPrefill(null);
      setDashboardInitialTab(undefined);
      setSelectedProductId(entry.productId ?? null);
      setCurrentView(entry.acuaView);
      restoreScroll(entry.scrollY ?? 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    const productId = currentView === 'product' ? selectedProductId : null;
    const params = new URLSearchParams(window.location.search);
    if (productId) params.set('product', productId);
    else params.delete('product');
    const query = params.toString();
    const url = (VIEW_PATHS[currentView] ?? '/') + (query ? `?${query}` : '') + window.location.hash;
    const entry = { acuaView: currentView, productId };

    if (!historyInitializedRef.current) {
      // Label the entry the visitor landed on rather than adding one.
      historyInitializedRef.current = true;
      window.history.replaceState(entry, '', url);
      return;
    }
    const current = window.history.state;
    // Already on this entry: the change came from Back/Forward (or a
    // StrictMode re-run), so there's nothing to push.
    if (current?.acuaView === currentView && (current.productId ?? null) === productId) return;
    window.history.replaceState({ ...current, scrollY: lastScrollYRef.current }, '');
    window.history.pushState(entry, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView, selectedProductId]);

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

  // The '#n' suffix guarantees this is a distinct string every single call,
  // even when it's the same tab as last time — without it, clicking
  // Settings, manually switching to a different tab locally, then clicking
  // Settings again would set dashboardInitialTab to the exact same value
  // it already held, and React bails out of re-rendering on an unchanged
  // value, so the dashboard's own useEffect watching this prop would never
  // re-fire and the tab would silently fail to switch back. Consumers
  // split off the '#n' before using the tab name (see PatronDashboardView/
  // AdminView's identical parsing).
  const goToDashboardTab = (tab) => {
    setCommissionPrefill(null);
    dashboardTabRequestIdRef.current += 1;
    setDashboardInitialTab(`${tab}#${dashboardTabRequestIdRef.current}`);
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
        onOpenSettings={() => setIsSettingsOpen(true)}
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
      <SettingsOverlay open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <Toast toast={toast} onDismiss={dismissToast} />

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
            key={selectedProductId}
            productId={selectedProductId}
            setCurrentView={navigateTo}
            onRequestSimilar={handleRequestSimilar}
            onViewProduct={handleViewProduct}
          />
        </Suspense>
      )}
      {(currentView === 'privacy' || currentView === 'terms') && (
        <Suspense fallback={<ViewLoadingFallback />}>
          <LegalView doc={currentView} setCurrentView={navigateTo} />
        </Suspense>
      )}
      {currentView === 'faq' && (
        <Suspense fallback={<ViewLoadingFallback />}>
          <FAQView />
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
          <ConciergeChat hidden={isCartOpen || isSearchOpen} />
        </Suspense>
      )}
    </div>
  );
}
