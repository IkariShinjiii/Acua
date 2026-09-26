import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow, mapArchiveRow } from '../lib/mapProduct';
import { handleImageError } from '../lib/imageFallback';
import { unsplashSrcSet } from '../lib/responsiveImage';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function SearchOverlay({ open, onClose, onSelectProduct, onRequestSimilar }) {
  const [query, setQuery] = useState('');
  const [pieces, setPieces] = useState([]);
  // Past sold 1-of-1 pieces (The Archive) — searchable so a visitor who
  // saw one on Instagram can find it, same as they'd find it by scrolling
  // to that section on the homepage. Not purchasable, so results render
  // and behave differently below (Request Similar, not Add to Cart).
  const [archiveItems, setArchiveItems] = useState([]);
  // A failed catalog fetch used to look exactly like "no pieces match
  // that search" — a real outage would read as "this term doesn't exist"
  // rather than "something's wrong," and since it happens before anyone's
  // even typed anything, it would misfire on every single search attempt.
  const [loadFailed, setLoadFailed] = useState(false);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);
  // Bumped on every load attempt (an open toggle or a manual "Try Again")
  // so a still-in-flight request from a superseded attempt can't overwrite
  // whatever a newer one already resolved.
  const requestIdRef = useRef(0);

  const loadPieces = useCallback(() => {
    const thisRequestId = ++requestIdRef.current;
    setLoadFailed(false);
    return Promise.all([
      supabase.from('products').select('*'),
      supabase.from('archive_items').select('*').order('created_at', { ascending: true }),
    ]).then(([productsRes, archiveRes]) => {
      if (requestIdRef.current !== thisRequestId) return;
      if (productsRes.error || !productsRes.data || archiveRes.error || !archiveRes.data) {
        setLoadFailed(true);
        setPieces([]);
        setArchiveItems([]);
        return;
      }
      setPieces(productsRes.data.map(mapProductRow));
      setArchiveItems(archiveRes.data.map(mapArchiveRow));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    // Focus after the entrance animation starts rendering the input.
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    loadPieces();
    return () => clearTimeout(id);
  }, [open, loadPieces]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const matches = (p) => [p.title, p.category, p.material].some((field) => field.toLowerCase().includes(q));
  const results = q
    ? [
        ...pieces.filter(matches).map((p) => ({ ...p, type: 'product' })),
        ...archiveItems.filter(matches).map((a) => ({ ...a, type: 'archive' })),
      ]
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-on-surface/70 z-[100] flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-sand rounded-3xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Search catalog"
          >
            <div className="flex items-center gap-3 p-5 border-b border-outline-variant/30">
              <Search className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, category, or material…"
                aria-label="Search by name, category, or material"
                className="flex-1 py-3 -my-3 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 text-sm"
              />
              <button
                onClick={onClose}
                className="p-2.5 rounded-full hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-on-surface flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loadFailed ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Couldn't load the catalog to search — this is a connection issue on our end,
                    not a sign there's nothing to find.
                  </p>
                  <button
                    onClick={loadPieces}
                    className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {q && results.length === 0 && (
                    <p className="text-center text-sm text-on-surface-variant py-12">
                      No pieces match "{query}".
                    </p>
                  )}
                  {!q && (
                    <p className="text-center text-sm text-on-surface-variant py-12">
                      Start typing to search Available Pieces and The Archive.
                    </p>
                  )}
                </>
              )}
              {results.map((piece) => (
                <button
                  key={`${piece.type}-${piece.id}`}
                  onClick={() => {
                    if (piece.type === 'archive') {
                      onRequestSimilar?.({ ...piece, source: 'archive' });
                    } else {
                      onSelectProduct(piece.id);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chile-rojo"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low">
                    <img
                      src={piece.image}
                      srcSet={unsplashSrcSet(piece.image)}
                      sizes="56px"
                      alt={piece.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => handleImageError(e, piece.fallback)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{piece.title}</p>
                    <p className="text-xs text-on-surface-variant">{piece.category} • {piece.material}</p>
                  </div>
                  {piece.type === 'archive' ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant flex-shrink-0 bg-surface-container px-2.5 py-1 rounded-full">
                      1-of-1 · Archive
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-terracota-deep dark:text-terracota flex-shrink-0">
                      {piece.price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
