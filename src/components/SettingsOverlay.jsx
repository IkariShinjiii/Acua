import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, LogIn, FileText, ShieldCheck, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import AccountSettingsPanel from './AccountSettingsPanel';

// Site-wide settings, reachable whether signed in or not — previously
// "Account Settings" only existed as a tab inside the signed-in dashboard,
// which meant (a) a signed-out visitor had no equivalent settings surface
// at all, so appearance (dark/light) lived as a separate standalone navbar
// icon instead, and (b) the account dropdown's "My Account" and "Account
// Settings" both opened the exact same dashboard component, just on a
// different starting tab — two entries for what read as one destination.
// This replaces both dashboard "settings" tabs (patron and admin) and the
// standalone theme-toggle icon with one panel: Appearance always shows,
// Profile/Password show only once signed in.
export default function SettingsOverlay({ open, onClose, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  const goToLegal = (view) => {
    onNavigate(view);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-surface/50 z-[90]"
          />
          <motion.div
            ref={dialogRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-sand z-[100] shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
          >
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 flex-shrink-0">
              <h2 className="font-serif text-xl text-on-surface">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container transition-colors border-none bg-transparent cursor-pointer text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 space-y-3">
                <h3 className="font-serif text-lg text-on-surface">Appearance</h3>
                <div className="flex gap-2 bg-surface-container rounded-full p-1">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        if (theme !== id) toggleTheme();
                      }}
                      aria-pressed={theme === id}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container ${
                        theme === id
                          ? 'bg-surface-elevated text-on-surface shadow-cloud-sm'
                          : 'text-on-surface-variant bg-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {user ? (
                <AccountSettingsPanel />
              ) : (
                <div className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Log in to manage your profile, password, and orders.
                  </p>
                </div>
              )}

              <div className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 space-y-3">
                <h3 className="font-serif text-lg text-on-surface">Legal</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => goToLegal('privacy')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-on-surface bg-transparent border-none cursor-pointer hover:bg-surface-container-low transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                  >
                    <ShieldCheck className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <span className="flex-1 text-left">Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToLegal('terms')}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-on-surface bg-transparent border-none cursor-pointer hover:bg-surface-container-low transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
                  >
                    <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <span className="flex-1 text-left">Terms of Service</span>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
