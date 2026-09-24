import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow } from '../lib/mapProduct';
import { homeCache } from '../lib/homeCache';
import { handleImageError } from '../lib/imageFallback';
import { unsplashSrcSet } from '../lib/responsiveImage';

const COUNT = 4;

// Up to four other pieces that are still for sale, same category first,
// newest first within each group. Reuses the homepage's cached catalog when
// the visitor came from there; a direct/shared product link fetches it.
function pickRelated(pieces, current) {
  const candidates = pieces.filter((p) => p.id !== current.id && !p.soldOut);
  const same = candidates.filter((p) => p.category === current.category);
  const other = candidates.filter((p) => p.category !== current.category);
  return [...same, ...other].slice(0, COUNT);
}

export default function RelatedPieces({ product, onViewProduct }) {
  const [catalog, setCatalog] = useState(homeCache.pieces);

  useEffect(() => {
    if (homeCache.pieces) return undefined;
    let cancelled = false;
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setCatalog(data.map(mapProductRow));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const related = catalog ? pickRelated(catalog, product) : [];
  // Nothing worth showing (or still loading): leave no empty section behind.
  if (related.length === 0) return null;

  return (
    <section className="mt-16 sm:mt-20 pt-10 border-t border-outline-variant/30" aria-labelledby="related-heading">
      <h2 id="related-heading" className="font-serif text-2xl sm:text-3xl text-on-surface mb-6">
        You may also like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {related.map((piece) => (
          <button
            key={piece.id}
            type="button"
            onClick={() => onViewProduct(piece.id)}
            className="group text-left bg-surface-elevated rounded-[20px] sm:rounded-3xl p-3 sm:p-4 shadow-[0_12px_35px_-8px_rgba(38,28,20,0.06)] hover:shadow-[0_20px_45px_-10px_rgba(38,28,20,0.12)] transition-shadow duration-500 border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-surface-container-low mb-3">
              <img
                src={piece.image}
                srcSet={unsplashSrcSet(piece.image)}
                sizes="(min-width: 768px) 25vw, 50vw"
                alt={piece.title}
                loading="lazy"
                onError={(e) => handleImageError(e, piece.fallback)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {piece.isOneOfOne && (
                <span className="absolute top-2 left-2 bg-chile-rojo text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                  1-of-1
                </span>
              )}
            </div>
            <p className="font-sans text-sm text-on-surface font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {piece.title}
            </p>
            <p className="font-sans text-sm text-terracota-deep dark:text-terracota font-semibold mt-1">{piece.price}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
