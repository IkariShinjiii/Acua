"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReviewReel from "../components/ReviewReel";

// Image Fallback Handler
const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string
) => {
  if (e.currentTarget.src !== fallbackUrl) {
    e.currentTarget.src = fallbackUrl;
  }
};

interface Product {
  id: string;
  title: string;
  category: "Necklaces" | "Bracelets" | "Rings" | "Earrings";
  material: string;
  description: string;
  price: string;
  image: string;
  fallback: string;
}

// Curated Available Pieces for Bento Catalog
const AVAILABLE_PIECES: Product[] = [
  {
    id: "ap-1",
    title: "Pearl Drop Chain",
    category: "Necklaces",
    material: "14k Gold Fill & Baroque Pearl",
    description:
      "A single, luminous baroque freshwater pearl suspended on an ethically forged 14k gold fill chain.",
    price: "$180",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-2",
    title: "Hammered Stacking Set",
    category: "Rings",
    material: "Recycled Sterling Silver",
    description:
      "Trio of slim, organically textured bands sculpted to evoke gentle coastal tide lines.",
    price: "$150",
    image:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-3",
    title: "Woven Sand Bracelet",
    category: "Bracelets",
    material: "18k Gold Vermeil",
    description:
      "Intricately braided chain with a molten sculptural clasp inspired by windswept coastal grass.",
    price: "$290",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1611591475887-f8232bfdf1fb?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-4",
    title: "Solitary Tidal Ear Cuff",
    category: "Earrings",
    material: "Sterling Silver",
    description:
      "Molten textured silver designed to hug the upper ear curve comfortably without piercing.",
    price: "$145",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-5",
    title: "Dune Texture Ring",
    category: "Rings",
    material: "14k Solid Gold",
    description:
      "Substantially weighted band handcrafted with natural hammered facets that catch the ocean light.",
    price: "$480",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-6",
    title: "Azure Drop Pendant",
    category: "Necklaces",
    material: "Recycled Silver & Aquamarine",
    description:
      "Raw uncut ocean aquamarine encased in hand-shaped molten silver settings.",
    price: "$240",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
  },
];

const ARCHIVE_ITEMS = [
  {
    id: "arch-1",
    aspect: "aspect-square",
    mt: "",
    image:
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80",
    alt: "Custom ring featuring an uncut raw sapphire set in rough, textured silver on dark slate rock",
  },
  {
    id: "arch-2",
    aspect: "aspect-[3/4]",
    mt: "mt-0 md:mt-8",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    alt: "Sculptural gold pendant looking like melted wax or molten metal",
  },
  {
    id: "arch-3",
    aspect: "aspect-square",
    mt: "",
    image:
      "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80",
    alt: "Delicate silver chain with sea-green seaglass charm resting on textured linen",
  },
  {
    id: "arch-4",
    aspect: "aspect-[3/4]",
    mt: "mt-0 md:mt-8",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80",
    alt: "Statement earrings made of hammered brass and irregular freshwater pearls on warm sand",
  },
];

const FILTER_TABS = ["All", "Necklaces", "Bracelets", "Rings", "Earrings"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const handleAdd = (id: string) => {
    setAddedItem(id);
    setTimeout(() => setAddedItem(null), 1600);
  };

  const filteredPieces =
    activeFilter === "All"
      ? AVAILABLE_PIECES
      : AVAILABLE_PIECES.filter((p) => p.category === activeFilter);

  return (
    <div className="bg-[#F9F6F0] text-[#1d1c16] font-sans antialiased min-h-screen flex flex-col selection:bg-[#ae431e] selection:text-white">
      {/* 1. Single Luxury Sticky Navigation */}
      <Navbar />

      <main className="flex-grow pt-20">
        {/* 2. Hero Section */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-6 mb-24 sm:mb-32">
          <div className="relative w-full h-[620px] md:h-[820px] rounded-[28px] sm:rounded-[40px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(38,28,20,0.08)] group">
            <div
              className="absolute inset-0 bg-cover bg-center w-full h-full transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85')",
              }}
            />
            {/* Warm Terracotta Bottom Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#ae431e]/85 via-black/25 to-transparent pointer-events-none" />

            <div className="absolute bottom-12 left-8 md:left-16 max-w-xl z-10">
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white mb-6 drop-shadow-md font-normal leading-[1.1] tracking-normal">
                Tides &amp; Time
              </h1>
              <p className="font-sans text-base sm:text-lg text-white/90 mb-8 max-w-md hidden md:block leading-relaxed">
                The new coastal collection. Forged by hand, shaped by the sea.
              </p>
              <a
                href="#available-pieces"
                className="bg-[#ae431e] hover:bg-[#8d2c06] text-white font-sans text-xs uppercase font-semibold tracking-[0.18em] h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center border-none"
              >
                SHOP NEW COLLECTION
              </a>
            </div>
          </div>
        </section>

        {/* 3. New Arrivals: Framer ReviewReel Infinite Marquee Carousel */}
        <section className="w-full mb-28 sm:mb-36 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-between items-end">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1d1c16] font-normal tracking-tight">
                New Arrivals
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#57423b] mt-1.5 hidden sm:block">
                Seasonal artifacts hand-sculpted in limited batches — hover to inspect
              </p>
            </div>

            <a
              className="font-sans text-xs font-semibold text-[#ae431e] hover:text-[#d68224] transition-colors underline underline-offset-4 tracking-wider uppercase"
              href="#available-pieces"
            >
              VIEW ALL
            </a>
          </div>

          <ReviewReel
            onSelectProduct={() => {
              const el = document.getElementById("available-pieces");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>

        {/* 4. Available Pieces: Filter Tabs & Cloud UI Product Cards */}
        <section
          id="available-pieces"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-28 sm:mb-36"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1d1c16] font-normal tracking-tight">
                Available Pieces
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#57423b] mt-1.5">
                Singular artifacts forged for modern permanence
              </p>
            </div>

            {/* Clean Pill Filter Tabs */}
            <div className="flex flex-wrap gap-2.5">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-6 py-2.5 rounded-full font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer border-none ${
                      isActive
                        ? "bg-[#38332B] text-white shadow-md active:scale-95"
                        : "bg-[#f2ede4] border border-[#dec0b7]/30 text-[#1d1c16] hover:bg-[#eac891]/30 hover:border-[#d68224]/40"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Bento Cloud Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="group cursor-pointer rounded-[24px] sm:rounded-[32px] bg-white shadow-[0_12px_35px_-8px_rgba(38,28,20,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(38,28,20,0.12)] transition-all duration-500 overflow-hidden flex flex-col border-none p-5 sm:p-6"
                >
                  {/* Square Aspect Ratio Product Thumbnail */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f8f3ea] mb-5">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={piece.image}
                      alt={piece.title}
                      onError={(e) => handleImageError(e, piece.fallback)}
                    />
                  </div>

                  {/* Card Description & Action Row */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-sans text-base sm:text-lg text-[#1d1c16] font-medium mb-1.5 group-hover:text-[#ae431e] transition-colors">
                        {piece.title}
                      </h3>
                      <p className="font-sans text-xs text-[#57423b] line-clamp-2 mb-4 leading-relaxed font-light">
                        {piece.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-[#f2ede4]">
                      <span className="font-sans text-base text-[#d68224] font-semibold">
                        {piece.price}
                      </span>
                      <button
                        onClick={() => handleAdd(piece.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-none cursor-pointer ${
                          addedItem === piece.id
                            ? "bg-[#ae431e] text-white"
                            : "bg-[#f8f3ea] text-[#ae431e] hover:bg-[#ae431e] hover:text-white"
                        }`}
                        aria-label={`Add ${piece.title} to cart`}
                      >
                        {addedItem === piece.id ? (
                          <Check className="w-5 h-5 stroke-[2]" />
                        ) : (
                          <Plus className="w-5 h-5 stroke-[2]" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-14 text-center">
            <button
              onClick={() => setActiveFilter("All")}
              className="px-8 py-3.5 rounded-full bg-[#f2ede4] border border-[#dec0b7]/30 text-[#1d1c16] font-sans text-xs font-semibold tracking-widest uppercase hover:bg-[#ece8df] hover:border-[#d68224]/50 transition-colors shadow-sm cursor-pointer"
            >
              LOAD MORE
            </button>
          </div>
        </section>

        {/* 5. The Archive: Bespoke Creations Showcase */}
        <section className="bg-[#f8f3ea] py-24 sm:py-32 border-t border-[#dec0b7]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-serif text-3xl sm:text-5xl text-[#1d1c16] mb-4 font-normal tracking-tight">
                The Archive
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#57423b] leading-relaxed font-light">
                Past 1-of-1 creations. Sold out, but forever inspiring. Browse the
                archive to spark ideas for your custom coastal piece.
              </p>
            </div>

            {/* 4-Column Asymmetric Staggered Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
              {ARCHIVE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl md:rounded-3xl overflow-hidden ${item.aspect} ${item.mt} shadow-[0_10px_30px_-8px_rgba(38,28,20,0.06)] cursor-pointer bg-[#ede4d8]`}
                >
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale-[20%] group-hover:grayscale-0"
                    src={item.image}
                    alt={item.alt}
                    onError={(e) => handleImageError(e, item.fallback)}
                  />
                  <div className="absolute inset-0 bg-[#ae431e]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-[#d68224] text-white font-sans text-xs font-semibold px-4 py-2 rounded-full tracking-wider shadow-sm">
                      1-OF-1
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <a
                href="#custom-request"
                className="bg-[#ae431e] hover:bg-[#8d2c06] text-white font-sans text-xs uppercase font-semibold tracking-wider h-14 px-9 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 inline-flex items-center justify-center border-none"
              >
                START A CUSTOM REQUEST
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Deep Terracotta Footer */}
      <Footer />
    </div>
  );
}
