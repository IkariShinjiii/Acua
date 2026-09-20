import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#9B3B1C] text-white selection:bg-[#F9F6F0] selection:text-[#9B3B1C]">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand & Manifesto Column */}
          <div className="md:col-span-5 space-y-6">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl sm:text-4xl tracking-[0.25em] uppercase font-normal text-white">
                ACUA
              </span>
            </Link>
            <p className="text-white/80 text-sm font-light leading-relaxed max-w-sm">
              Sculptural fine jewelry forged by coastal elements, molten metals,
              and singular sea-born gems. Made by hand for timeless permanence.
            </p>
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/60 mb-3">
                Stay in Our Orbit
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex max-w-sm items-center rounded-full bg-white/10 p-1 backdrop-blur-sm border border-white/15 focus-within:border-white/40 transition-colors"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-[#9B3B1C] transition-transform hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/50">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-white/80 font-light">
              <li>
                <Link href="#shop" className="hover:text-white transition-colors">
                  Tides & Time
                </Link>
              </li>
              <li>
                <Link href="#new-arrivals" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="#available" className="hover:text-white transition-colors">
                  Available Pieces
                </Link>
              </li>
              <li>
                <Link href="#archive" className="hover:text-white transition-colors">
                  The Archive
                </Link>
              </li>
              <li>
                <Link href="#custom-request" className="hover:text-white transition-colors">
                  Custom Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Concierge & Care */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/50">
              Concierge
            </h4>
            <ul className="space-y-2.5 text-xs text-white/80 font-light">
              <li>
                <a href="#care" className="hover:text-white transition-colors">
                  Jewelry Care Guide
                </a>
              </li>
              <li>
                <a href="#sizing" className="hover:text-white transition-colors">
                  Ring Sizing Guide
                </a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact Studio
                </a>
              </li>
            </ul>
          </div>

          {/* Studio Values */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/50">
              Studio & Ethics
            </h4>
            <p className="text-xs text-white/80 font-light leading-relaxed">
              Every artifact is responsibly made using 100% recycled 14k/18k
              gold, sterling silver, and ethically gathered sea glass and pearls.
            </p>
            <div className="pt-3 flex items-center space-x-6 text-xs uppercase tracking-widest text-white/70">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Pinterest
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/60 gap-4">
          <p>© {new Date().getFullYear()} ACUA. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#accessibility" className="hover:text-white transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
