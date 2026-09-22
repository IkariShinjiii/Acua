import React from 'react';
import { InstagramIcon, FacebookIcon, TiktokIcon } from './SocialIcons';
import logoMarkCream from '../assets/logo-mark-cream.png';

// Shared across every storefront-facing view (rendered once from App.jsx)
// so there's a single footer to keep correct, instead of the drift that
// happens when each view carries its own copy — which is exactly how the
// old HomeView footer ended up with three links to sections that don't
// exist, a hardcoded stale copyright year, and a completely different
// (and much thinner) footer existed on the Commission page, while the
// product page and patron dashboard had no footer at all.
export default function Footer({ setCurrentView, onTrackCommission }) {
  // See the same helper in Navbar.jsx: switching view and reading the DOM
  // in the same tick doesn't work from any page but home, since the
  // re-render triggered by setCurrentView hasn't committed yet.
  const goToCollections = () => {
    setCurrentView('home');
    setTimeout(() => {
      document.getElementById('available-pieces')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const linkClass =
    'text-left text-sm text-white/90 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo';
  // Not the shared `sunset` token (#eac891) — at this small 11px size it
  // measures 3.63:1 against the footer's chile-rojo background, short of
  // WCAG AA's 4.5:1 for text. This is a one-off, slightly lighter tint
  // scoped to just these footer labels; `sunset` itself is a flat brand
  // hex used in ~20 other places (nav indicator, focus rings, buttons)
  // that are non-text UI and not worth touching for this.
  const headingClass = 'text-[11px] uppercase tracking-widest font-semibold text-[#f9e6c2]';

  return (
    <footer className="w-full mt-auto bg-chile-rojo text-white">
      {/* pb-28 (not the plain py-16 the rest of this padding uses) is
          deliberate: on any viewport narrower than max-w-7xl — every
          tablet, most laptops — this container spans the full viewport
          width, putting the bottom bar's right-aligned tagline in the
          exact same bottom-right corner as ConciergeChat's fixed toggle
          button. Desktop viewports never showed this because the
          centered, narrower content column left that corner empty. This
          reserves enough clearance that once scrolled to the true
          bottom of the page, the tagline has already cleared the
          button's fixed vertical position instead of sitting under it. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10">
          <div className="col-span-2 sm:col-span-1 flex flex-col items-start gap-3">
            <img src={logoMarkCream} alt="ACUA" className="h-12 w-auto" loading="lazy" />
            <p className="text-xs text-white/90 leading-relaxed max-w-[220px]">
              Handmade coastal accessories, hand-assembled in Iloilo City, Philippines.
            </p>
            <div className="flex items-center gap-4 mt-1">
              <a
                href="https://www.instagram.com/acua_ph/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="ACUA on Instagram"
                className="text-white/90 hover:text-sunset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo rounded-full"
              >
                <InstagramIcon className="w-[18px] h-[18px]" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61577296311917"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="ACUA on Facebook"
                className="text-white/90 hover:text-sunset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo rounded-full"
              >
                <FacebookIcon className="w-[18px] h-[18px]" />
              </a>
              <a
                href="https://www.tiktok.com/@acua_ph"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="ACUA on TikTok"
                className="text-white/90 hover:text-sunset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-chile-rojo rounded-full"
              >
                <TiktokIcon className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className={headingClass}>Shop</span>
            <button onClick={() => setCurrentView('home')} className={linkClass}>
              Shop
            </button>
            <button onClick={goToCollections} className={linkClass}>
              Collections
            </button>
            <button onClick={() => setCurrentView('commission')} className={linkClass}>
              Custom Request
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <span className={headingClass}>Account</span>
            <button onClick={() => setCurrentView('dashboard')} className={linkClass}>
              My Account
            </button>
            <button onClick={onTrackCommission} className={linkClass}>
              Track a Commission
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <span className={headingClass}>Get in Touch</span>
            <a href="mailto:acuavibe@gmail.com" className={linkClass}>
              acuavibe@gmail.com
            </a>
            <a
              href="https://www.instagram.com/acua_ph/"
              target="_blank"
              rel="noreferrer noopener"
              className={linkClass}
            >
              @acua_ph
            </a>
            <span className="text-sm text-white/85">Iloilo City, Philippines</span>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/85 uppercase tracking-wider">
          <span>© {new Date().getFullYear()} ACUA. Handcrafted by the coast.</span>
          <span className="text-[#f9e6c2] normal-case tracking-widest">
            Naturally rooted. Intentionally designed.
          </span>
        </div>
      </div>
    </footer>
  );
}
