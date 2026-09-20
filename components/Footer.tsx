import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full mt-auto bg-[#AE431E] text-on-primary">
      <div className="flex flex-col md:flex-row justify-between items-center gap-gutter py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="bg-[#FEF9F0] px-4 py-2 rounded-lg shadow-sm inline-flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1VxAbR-SmqjNgMNhlUZhu0roiYBczplUVxoabnOHpu18h2WakERPWes11t9ljefc4nMbDFaaI2mE8Zysn0R0m6xoWn5d8tt_DV2baG3JMEk2d5Hc1DlbWbWZZQQ8qN9jN0u96XT0KQhdsWbKm-ycCWqNKfgBN1B20_QiSwGadFz4x3ELyIlJjJ3vjcV6ZD7_LL6_q1xwKmKLwdcwddGuHG3apTea8z_XISsfcfr9vA9oCi_bvSGaO2gMQ_A"
              alt="ACUA Brand Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#EAC891] opacity-95 font-medium mt-1">
            NATURALLY ROOTED. INTENTIONALLY DESIGNED.
          </span>
        </div>

        <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link
            className="font-label-caps text-label-caps text-white/80 hover:text-white transition-colors"
            href="#sustainability"
          >
            Sustainability
          </Link>
          <Link
            className="font-label-caps text-label-caps text-white/80 hover:text-white transition-colors"
            href="#shipping"
          >
            Shipping
          </Link>
          <Link
            className="font-label-caps text-label-caps text-white/80 hover:text-white transition-colors"
            href="#returns"
          >
            Returns
          </Link>
          <Link
            className="font-label-caps text-label-caps text-white/80 hover:text-white transition-colors"
            href="#contact"
          >
            Contact
          </Link>
        </nav>

        <div className="font-label-caps text-label-caps text-white/70 text-center md:text-right">
          © 2024 ACUA. HANDCRAFTED BY THE COAST.
        </div>
      </div>
    </footer>
  );
}
