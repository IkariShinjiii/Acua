import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, Sun, Moon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import logoMarkOlive from '../assets/logo-mark-olive.png';

export default function Navbar({
  currentView,
  setCurrentView,
  cartCount = 2,
  onOpenCart,
  onOpenSearch,
  onAccountClick,
  onOpenSettings,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Matches CartDrawer/SearchOverlay: Escape closes it, same as tapping
  // outside — otherwise this is the only overlay in the app a keyboard or
  // touch user has no way to dismiss except re-pressing the toggle itself.
  // Covers both the mobile drawer and the account dropdown — either one
  // being open means the same "tap outside/Escape closes it" rule applies.
  useEffect(() => {
    if (!mobileMenuOpen && !accountMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };
    const onPointerDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileMenuOpen, accountMenuOpen]);

  // Switching view and reading the DOM in the same tick doesn't work from
  // any page other than home: setCurrentView's re-render hasn't committed
  // yet, so #available-pieces isn't in the DOM when getElementById runs
  // right after it — the scroll silently no-ops. The short delay gives
  // HomeView a chance to actually mount first.
  const goToCollections = () => {
    setCurrentView('home');
    setTimeout(() => {
      document.getElementById('available-pieces')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Translucent over the hero image (home, unscrolled); solid everywhere
  // else — including while the mobile drawer is open, so the header
  // doesn't sit as a translucent strip of hero photo directly above the
  // drawer's own solid panel. It reverts to translucent as soon as the
  // drawer closes (still on an unscrolled home view).
  const isTransparent = currentView === 'home' && !isScrolled && !mobileMenuOpen;
  const textBase = isTransparent ? 'text-white/85' : 'text-on-surface-variant';
  const textStrong = isTransparent ? 'text-white' : 'text-on-surface';
  const accent = isTransparent ? 'text-sunset' : 'text-accent';
  const accentHover = isTransparent ? 'hover:text-sunset' : 'hover:text-accent';
  const accentBar = isTransparent ? 'bg-sunset' : 'bg-chile-rojo';
  // Transparent state sits over the fixed-dark hero photo (bg-ink, same
  // fix as HomeView's scrim) — not the theme-aware surface, which would
  // put a near-white ring offset over the photo in dark mode.
  const ringOffset = isTransparent ? 'focus-visible:ring-offset-ink' : 'focus-visible:ring-offset-sand';
  // Fixed olive, matching the wordmark text next to it (see its own
  // comment) — the real logo artwork pairs the icon and the lettering in
  // one consistent color, not a theme-swapped icon next to a fixed-color
  // wordmark the way this looked before.
  const logoMark = logoMarkOlive;

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-500 ${
        isTransparent
          ? 'bg-transparent py-6'
          : 'bg-sand/95 backdrop-blur-md shadow-[0_4px_20px_-2px_rgba(38,28,20,0.04)] py-3'
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
            <img src={logoMark} alt="" className="h-8 sm:h-9 w-auto" />
            {/* Fixed text-olive, not the theme-aware textStrong every other
                header element uses — the owner picked olive from four real
                logo color variants (the other three were ruled out: two
                are orange-family colors being retired for a new palette,
                one duplicates the tan already tried in an earlier pass).
                Olive clears WCAG's 3:1 floor against both the light theme's
                cream bar (3.34:1) and the dark theme's near-black one
                (4.91:1), so unlike that tan attempt, one fixed color works
                everywhere without a light/dark fallback. */}
            <span className="font-wordmark text-2xl sm:text-3xl tracking-[0.24em] uppercase font-bold text-olive">
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
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} ${
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
              onClick={goToCollections}
              className={`text-xs uppercase tracking-[0.2em] transition-colors py-1 font-medium bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} ${textBase} ${accentHover}`}
            >
              Collections
            </button>

            <button
              onClick={() => setCurrentView('commission')}
              className={`text-xs uppercase tracking-[0.2em] transition-colors relative py-1 font-medium bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} ${
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
              onClick={onOpenSearch}
              className={`hidden md:inline-flex p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label="Search Catalog"
              aria-haspopup="dialog"
            >
              <Search className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>

            <button
              onClick={onOpenCart}
              className={`relative p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full group border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label={`Cart with ${cartCount} items`}
              aria-haspopup="dialog"
            >
              <ShoppingBag className="w-[18px] h-[18px] stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[15px] h-[15px] px-1 bg-chile-rojo text-white text-[9px] font-medium rounded-full flex items-center justify-center leading-none shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => setAccountMenuOpen((v) => !v)}
                className={`inline-flex items-center gap-0.5 p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
              >
                <User className="w-[18px] h-[18px] stroke-[1.5]" />
                <ChevronDown
                  className={`w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-full mt-2 w-52 bg-surface-elevated rounded-2xl shadow-cloud ring-1 ring-black/5 p-1.5 flex flex-col"
                  >
                    {user ? (
                      <>
                        <button
                          role="menuitem"
                          onClick={() => {
                            onAccountClick?.();
                            setAccountMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-xl text-on-surface hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                        >
                          <User className="w-4 h-4 stroke-[1.5] text-on-surface-variant" />
                          My Account
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => {
                            onOpenSettings?.();
                            setAccountMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-xl text-on-surface hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                        >
                          <Settings className="w-4 h-4 stroke-[1.5] text-on-surface-variant" />
                          Account Settings
                        </button>
                        <div className="h-px bg-outline-variant/30 my-1" />
                        <button
                          role="menuitem"
                          onClick={() => {
                            signOut();
                            setAccountMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-xl text-accent hover:bg-chile-rojo/10 transition-colors border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                        >
                          <LogOut className="w-4 h-4 stroke-[1.5]" />
                          Log Out
                        </button>
                      </>
                    ) : (
                      <button
                        role="menuitem"
                        onClick={() => {
                          onAccountClick?.();
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-xl text-on-surface hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                      >
                        <User className="w-4 h-4 stroke-[1.5] text-on-surface-variant" />
                        Log In / Sign Up
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className={`inline-flex p-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent cursor-pointer ${textStrong} ${accentHover}`}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] stroke-[1.5]" />
              ) : (
                <Moon className="w-[18px] h-[18px] stroke-[1.5]" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo ${ringOffset} rounded-full border-none bg-transparent ${textStrong} ${accentHover}`}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
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
            className="md:hidden bg-sand border-b border-outline-variant/30 px-6 py-6 shadow-lg"
          >
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  // Matches the desktop "Shop" link: without this, tapping
                  // Shop while already on Home (just scrolled down — a very
                  // likely reason to open the menu in the first place) did
                  // nothing at all, since setCurrentView('home') is a no-op
                  // re-render when you're already there.
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
              >
                Shop
              </button>
              <button
                onClick={() => {
                  goToCollections();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
              >
                Collections
              </button>
              <button
                onClick={() => {
                  setCurrentView('commission');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
              >
                Custom Request
              </button>

              {/* Search and Account only ever appeared as desktop-only icons
                  in the header (hidden md:inline-flex) — with nothing else
                  reachable on mobile, there was no way to search or log in
                  on a phone at all. */}
              <div className="pt-2 border-t border-outline-variant/30 flex flex-col space-y-4">
                <button
                  onClick={() => {
                    onOpenSearch?.();
                    setMobileMenuOpen(false);
                  }}
                  aria-haspopup="dialog"
                  className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
                >
                  <Search className="w-4 h-4 stroke-[1.5]" />
                  Search
                </button>
                <button
                  onClick={() => {
                    onAccountClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
                >
                  <User className="w-4 h-4 stroke-[1.5]" />
                  My Account
                </button>
                {/* Settings/Log Out only make sense once signed in — no
                    mobile equivalent existed before since the account icon
                    always just went straight to My Account. */}
                {user && (
                  <button
                    onClick={() => {
                      onOpenSettings?.();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-on-surface hover:text-accent bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
                  >
                    <Settings className="w-4 h-4 stroke-[1.5]" />
                    Account Settings
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-2.5 text-left text-sm uppercase tracking-[0.18em] py-2 text-accent hover:text-terracota bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-sand"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.5]" />
                    Log Out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
