import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// Replaces native alert()/confirm()-adjacent error popups with an in-page
// notification that matches the rest of the cloud-card design system,
// instead of a jarring browser-chrome dialog that blocks the page.
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type, key: Date.now() });
  };

  return { toast, showToast, dismissToast: () => setToast(null) };
}

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isError = toast?.type === 'error';

  return (
    // role="status"/aria-live live on this always-mounted wrapper, not the
    // motion.div below that comes and goes with AnimatePresence — a live
    // region needs to already exist in the DOM before its content changes
    // for assistive tech to reliably announce it; one inserted at the same
    // moment as the message it's meant to announce is exactly the pattern
    // several browser/screen-reader combinations miss.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm px-4 sm:px-0"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-start gap-3 rounded-2xl shadow-cloud-lg p-4 bg-surface-elevated border-none ${
              isError ? 'ring-1 ring-accent/20' : 'ring-1 ring-olive/20'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-olive flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-on-surface flex-1">{toast.message}</p>
            <button
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="text-on-surface-variant hover:text-on-surface transition-colors border-none bg-transparent cursor-pointer p-0.5 -m-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
