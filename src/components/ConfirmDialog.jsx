import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Replaces window.confirm() for destructive admin actions — a native
// browser dialog is exactly what Toast.jsx already moved the rest of the
// app's feedback away from, and this was the one place that pattern
// never reached. Same modal shape as CartDrawer/SearchOverlay: backdrop,
// Escape to cancel, and a real focus trap instead of just aria-modal.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-on-surface/50 z-[210] flex items-center justify-center px-4"
          onClick={onCancel}
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-sand rounded-3xl shadow-2xl p-6 space-y-4"
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl text-on-surface">{title}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
