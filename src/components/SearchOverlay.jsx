import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow } from '../lib/mapProduct';
import { handleImageError } from '../lib/imageFallback';

export default function SearchOverlay({ open, onClose, onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [pieces, setPieces] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      // Focus after the entrance animation starts rendering the input.
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      supabase
        .from('products')
        .select('*')
        .then(({ data, error }) => setPieces(error || !data ? [] : data.map(mapProductRow)));
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const results = q
    ? pieces.filter((p) =>
        [p.title, p.category, p.material].some((field) => field.toLowerCase().includes(q))
      )
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
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-sand rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 p-5 border-b border-outline-variant/30">
              <Search className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, category, or material…"
                className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 text-sm"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-on-surface flex-shrink-0"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {q && results.length === 0 && (
                <p className="text-center text-sm text-on-surface-variant py-12">
                  No pieces match "{query}".
                </p>
              )}
              {!q && (
                <p className="text-center text-sm text-on-surface-variant py-12">
                  Start typing to search Available Pieces.
                </p>
              )}
              {results.map((piece) => (
                <button
                  key={piece.id}
                  onClick={() => {
                    onSelectProduct(piece.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-left"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low">
                    <img
                      src={piece.image}
                      alt={piece.title}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, piece.fallback)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{piece.title}</p>
                    <p className="text-xs text-on-surface-variant">{piece.category} • {piece.material}</p>
                  </div>
                  <span className="text-sm font-semibold text-terracota flex-shrink-0">
                    {piece.price}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
