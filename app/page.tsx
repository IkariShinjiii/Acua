"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Animation presets
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: custom },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// Data Models
interface Product {
  id: string;
  title: string;
  category: "Necklaces" | "Bracelets" | "Rings" | "Earrings";
  price: string;
  description: string;
  image: string;
  badge?: string;
}

const NEW_ARRIVALS = [
  {
    id: "na-1",
    title: "Azure Drop Pendant",
    material: "Sterling Silver & Sea Glass",
    price: "$260",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-2",
    title: "Dune Texture Ring",
    material: "18k Gold Vermeil",
    price: "$180",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-3",
    title: "Tidal Wave Cuff",
    material: "Hand-Forged Silver",
    price: "$320",
    image:
      "https://images.unsplash.com/photo-1611591475887-f8232bfdf1fb?auto=format&fit=crop&w=1000&q=80",
  },
];

const AVAILABLE_PIECES: Product[] = [
  {
    id: "ap-1",
    title: "Pearl Woven Choker",
    category: "Necklaces",
    description: "Baroque freshwater pearls linked with recycled gold wire.",
    price: "$395",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-2",
    title: "Contoured Stacking Band",
    category: "Rings",
    description: "Solid 14k yellow gold band shaped like rolling ocean swell.",
    price: "$210",
    image:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-3",
    title: "Woven Strand Bracelet",
    category: "Bracelets",
    description: "Intricately braided chain with molten organic clasp.",
    price: "$340",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-4",
    title: "Solitary Tidal Ear Cuff",
    category: "Earrings",
    description: "Molten textured silver designed to hug the upper ear curve.",
    price: "$145",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-5",
    title: "Nautical Horizon Choker",
    category: "Necklaces",
    description: "Fine cable link necklace featuring a genuine tumbled sea gem.",
    price: "$285",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ap-6",
    title: "Crag Textured Signet",
    category: "Rings",
    description: "Chunky signet sculpted to evoke weathered ocean bluff stone.",
    price: "$310",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
];

const ARCHIVE_ITEMS = [
  {
    id: "arch-1",
    title: "Nocturne Sapphire Solitaire",
    era: "Winter 2024",
    image:
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "arch-2",
    title: "Molten Gold Relic Pendant",
    era: "Autumn 2024",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "arch-3",
    title: "Aquamarine Tidal Drop",
    era: "Spring 2025",
    image:
      "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "arch-4",
    title: "Baroque Cluster Cascades",
    era: "Summer 2025",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80",
  },
];

const CATEGORIES = ["All", "Necklaces", "Bracelets", "Rings", "Earrings"] as const;
type Category = (typeof CATEGORIES)[number];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [cartCount, setCartCount] = useState(2);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (id: string) => {
    setCartCount((prev) => prev + 1);
    setAddedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [id]: false }));
    }, 1800);
  };

  const filteredProducts =
    selectedCategory === "All"
      ? AVAILABLE_PIECES.slice(0, 3)
      : AVAILABLE_PIECES.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#261C14] font-sans antialiased selection:bg-[#9B3B1C] selection:text-white">
      {/* 1. STICKY NAVBAR */}
      <Navbar cartCount={cartCount} />

      <main className="w-full">
        {/* 2. HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-[540px] sm:h-[620px] md:h-[720px] rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(38,28,20,0.12)] group"
          >
            {/* Background Model Image */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"
                alt="Model on golden coastal beach wearing Acua jewelry"
                className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>

            {/* Warm Terracotta Gradient Overlay at the bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#9B3B1C]/90 via-[#9B3B1C]/35 to-transparent pointer-events-none" />

            {/* Subtle top vignette */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

            {/* Bottom Left Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 md:p-16 z-10">
              <div className="max-w-xl space-y-4 sm:space-y-5">
                <motion.h1
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                  className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-white tracking-normal leading-[1.1]"
                >
                  Tides & Time
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.35}
                  className="text-white/90 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-md"
                >
                  Our new summer collection. Completely hand sculpted by the sea.
                </motion.p>

                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                  className="pt-2"
                >
                  <a
                    href="#new-arrivals"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#9B3B1C] text-white text-xs sm:text-sm font-medium tracking-wide shadow-lg hover:bg-[#852E15] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-none"
                  >
                    Discover the Collection
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. NEW ARRIVALS */}
        <section id="new-arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header Row */}
          <div className="flex items-baseline justify-between mb-8 sm:mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#261C14] font-normal tracking-tight">
              New Arrivals
            </h2>
            <a
              href="#shop"
              className="text-xs uppercase tracking-[0.2em] font-semibold text-[#625448] hover:text-[#9B3B1C] transition-colors flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* 3-Column Tall Portrait Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {NEW_ARRIVALS.map((item, idx) => (
              <motion.article
                key={item.id}
                variants={fadeInUp}
                custom={idx * 0.15}
                className="group cursor-pointer flex flex-col"
              >
                {/* Tall Portrait Image Container */}
                <div className="relative aspect-[3/4] w-full rounded-[28px] sm:rounded-[32px] overflow-hidden bg-[#EDE4D8] shadow-[0_10px_30px_-10px_rgba(38,28,20,0.06)] group-hover:shadow-[0_20px_40px_-12px_rgba(38,28,20,0.12)] transition-all duration-500">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-[#261C14]/0 group-hover:bg-[#261C14]/5 transition-colors duration-300 pointer-events-none" />
                </div>

                {/* Info Beneath Image */}
                <div className="mt-4 px-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-normal text-[#261C14] group-hover:text-[#9B3B1C] transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-sm font-semibold text-[#261C14]">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-[#857568] mt-1 font-light">
                    {item.material}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* 4. AVAILABLE PIECES */}
        <section id="available" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Header Row & Pill Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 sm:mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#261C14] font-normal tracking-tight">
              Available Pieces
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 border-none outline-none ${
                      isActive
                        ? "bg-[#38332B] text-white shadow-md shadow-[#38332B]/15"
                        : "bg-[#EDE4D8]/80 text-[#261C14] hover:bg-[#E2D5C3]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Cloud UI Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isAdded = addedIds[product.id];
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-[28px] sm:rounded-[32px] p-5 shadow-[0_12px_35px_-8px_rgba(38,28,20,0.06)] hover:shadow-[0_20px_50px_-10px_rgba(38,28,20,0.1)] transition-all duration-500 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Square Product Image */}
                      <div className="relative aspect-square w-full rounded-[22px] overflow-hidden bg-[#F9F6F0] mb-5">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      </div>

                      {/* Product Content */}
                      <div className="px-1">
                        <h3 className="font-medium text-base text-[#261C14] group-hover:text-[#9B3B1C] transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-xs text-[#857568] mt-1.5 line-clamp-2 leading-relaxed font-light">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Price & Action */}
                    <div className="mt-6 pt-4 border-t border-[#F5EFE6] flex items-center justify-between px-1">
                      <span className="text-sm font-semibold text-[#261C14]">
                        {product.price}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-none ${
                          isAdded
                            ? "bg-[#38332B] text-white"
                            : "bg-[#F9F6F0] text-[#261C14] hover:bg-[#9B3B1C] hover:text-white"
                        }`}
                        aria-label={`Add ${product.title} to cart`}
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2]" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Centered Load More CTA Button */}
          <div className="mt-12 sm:mt-16 text-center">
            <button
              onClick={() => setSelectedCategory("All")}
              className="px-8 py-3.5 rounded-full bg-[#EDE4D8]/90 hover:bg-[#E2D5C3] text-[#261C14] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 border-none shadow-sm hover:shadow"
            >
              Load More
            </button>
          </div>
        </section>

        {/* 5. THE ARCHIVE */}
        <section id="archive" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Centered Header & Subtext */}
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="font-serif text-3xl sm:text-5xl text-[#261C14] font-normal tracking-tight">
              The Archive
            </h2>
            <p className="text-xs sm:text-sm text-[#857568] mt-3 sm:mt-4 leading-relaxed font-light">
              Sold out or bespoke creations that live on in our memory. Explore the
              catalog of past pieces or commission a bespoke creation for your own collection.
            </p>
          </div>

          {/* 4-Column Square Image Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
          >
            {ARCHIVE_ITEMS.map((item, idx) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                custom={idx * 0.1}
                className="group relative aspect-square rounded-[22px] sm:rounded-[28px] overflow-hidden bg-[#EDE4D8] shadow-[0_8px_25px_-6px_rgba(38,28,20,0.06)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                {/* Hover Reveal Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#261C14]/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                  <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/70">
                    {item.era}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Centered Terracotta CTA Button */}
          <div className="text-center">
            <a
              href="#custom-request"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-[#9B3B1C] text-white text-xs sm:text-sm font-medium tracking-wide shadow-lg hover:bg-[#852E15] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-none"
            >
              Request Archival Bespoke
            </a>
          </div>
        </section>
      </main>

      {/* 6. DEEP TERRACOTTA FOOTER */}
      <Footer />
    </div>
  );
}
