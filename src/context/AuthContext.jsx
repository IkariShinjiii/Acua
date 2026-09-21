import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True while a logged-in user's profile row is being fetched — lets
  // callers avoid flashing a "not authorized" state before isAdmin is known.
  const [profileLoading, setProfileLoading] = useState(false);
  // True once Supabase parses a password-recovery link from the URL (the
  // app has no router, so this is the only signal that the visitor just
  // followed a "reset your password" email — the whole app should show the
  // reset form instead of whatever view they'd otherwise land on).
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null)) // e.g. Supabase not configured — stay logged out, not stuck loading
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ?? null);
        setProfileLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    loading,
    profileLoading,
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    // redirectTo points back at the site root since there's no router to
    // send it to a dedicated /reset-password path — AuthContext's listener
    // above is what actually detects the recovery link on that reload.
    requestPasswordReset: (email) =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
