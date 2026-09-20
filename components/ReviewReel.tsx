"use client";

import React from "react";
import { motion } from "framer-motion";

// Image Fallback Handler
const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string
) => {
  if (e.currentTarget.src !== fallbackUrl) {
    e.currentTarget.src = fallbackUrl;
  }
};

export interface ReelProduct {
  id: string;
  title: string;
  material: string;
  price: string;
  image: string;
  fallback: string;
}

const REEL_ITEMS: ReelProduct[] = [
  {
    id: "na-1",
    title: "Azure Drop Pendant",
    material: "Recycled Silver & Aquamarine",
    price: "$240",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-2",
    title: "Dune Texture Ring",
    material: "14k Solid Gold",
    price: "$480",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-3",
    title: "Tidal Wave Cuff",
    material: "Hand-Forged Sterling Silver",
    price: "$320",
    image:
      "https://images.unsplash.com/photo-1611591475887-f8232bfdf1fb?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-4",
    title: "Solitary Tidal Ear Cuff",
    material: "Textured Fine Silver",
    price: "$145",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-5",
    title: "Nautical Horizon Choker",
    material: "Sea-Glass & 14k Cable Link",
    price: "$285",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "na-6",
    title: "Crag Textured Signet",
    material: "18k Solid Gold",
    price: "$310",
    image:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
    fallback:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
];

interface ReviewReelProps {
  onSelectProduct?: (product: ReelProduct) => void;
}

export default function ReviewReel({ onSelectProduct }: ReviewReelProps) {
  // Seamless loop with 2 duplicated tracks
  const duplicatedItems = [...REEL_ITEMS, ...REEL_ITEMS];

  return (
    <div className="relative w-full overflow-hidden py-4 select-none">
      {/* Editorial Edge Vignette Masking */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F9F6F0] via-[#F9F6F0]/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F9F6F0] via-[#F9F6F0]/80 to-transparent z-10" />

      {/* Ticker Animation Styles */}
      <style>{`
        @keyframes tickerEffect {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .framer-ticker-track {
          display: flex;
          width: max-content;
          animation: tickerEffect 34s linear infinite;
          will-change: transform;
        }
        .framer-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Infinite Scrolling Ticker Track */}
      <div className="framer-ticker-track flex gap-6 sm:gap-7 items-center">
        {duplicatedItems.map((item, idx) => (
          <motion.div
            key={`${item.id}-${idx}`}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onSelectProduct?.(item)}
            className="w-[280px] sm:w-[320px] flex-shrink-0 group cursor-pointer"
          >
            {/* Strict Portrait Aspect Ratio Card */}
            <div className="relative aspect-[4/5] w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-4 shadow-[0_10px_30px_-8px_rgba(174,67,30,0.08)] group-hover:shadow-[0_20px_45px_-10px_rgba(174,67,30,0.18)] transition-all duration-500 bg-[#EDE4D8]">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                src={item.image}
                alt={item.title}
                onError={(e) => handleImageError(e, item.fallback)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />

              {/* Subtle Pill Tag */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-[#FEF9F0]/85 backdrop-blur-md text-[10px] uppercase font-semibold tracking-widest text-[#1d1c16] shadow-sm">
                  1-of-1 Relic
                </span>
              </div>
            </div>

            {/* Product Meta */}
            <div className="flex justify-between items-start px-2">
              <div>
                <h3 className="font-sans text-base text-[#1d1c16] font-medium group-hover:text-[#ae431e] transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-xs text-[#57423b] mt-0.5 font-light">
                  {item.material}
                </p>
              </div>
              <span className="font-sans text-base text-[#d68224] font-semibold">
                {item.price}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
