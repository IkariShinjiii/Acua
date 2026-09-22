import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, REMEMBER_ME_KEY } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True while a logged-in user's profile row is being fetched — lets
  // callers avoid flashing a "not authorized" state before isAdmin is known.
  const [profileLoading, setProfileLoading] = useState(false);
  // True when the profiles fetch itself failed (resolved with an `error`,
  // or rejected outright) rather than genuinely finding no row. This has to
  // stay distinct from "profile is null" — isAdmin derives from profile, so
  // treating a fetch failure the same as "no profile" would silently show
  // a genuine admin the regular patron dashboard on a transient hiccup,
  // with nothing telling them their own account looked like it wasn't
  // theirs anymore.
  const [profileFailed, setProfileFailed] = useState(false);
  // StrictMode-safe the same way every other retriable fetch in this app
  // is: bumped on every attempt, compared at resolution time, so a stale
  // in-flight request from a superseded attempt can't overwrite whatever
  // the newer one already resolved.
  const profileRequestId = useRef(0);
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

  // PostgREST's code for ".single() matched zero rows" — the one case that
  // genuinely means "no profile row," as opposed to any other error (a real
  // fetch/RLS/network failure), which shouldn't be treated the same way
  // when it's what an admin's own access check is riding on.
  const PROFILE_NOT_FOUND_CODE = 'PGRST116';

  const loadProfile = useCallback((userId) => {
    const thisRequestId = ++profileRequestId.current;
    setProfileLoading(true);
    setProfileFailed(false);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (profileRequestId.current !== thisRequestId) return;
        if (error && error.code !== PROFILE_NOT_FOUND_CODE) {
          setProfileFailed(true);
          setProfile(null);
          setProfileLoading(false);
          return;
        }
        setProfile(data ?? null);
        setProfileLoading(false);
      })
      .catch(() => {
        if (profileRequestId.current !== thisRequestId) return;
        setProfileFailed(true);
        setProfile(null);
        setProfileLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!session?.user) {
      // Bump the id so a still-in-flight fetch from a just-ended session
      // can't land afterward and repopulate profile for a signed-out user.
      profileRequestId.current += 1;
      setProfile(null);
      setProfileLoading(false);
      setProfileFailed(false);
      return;
    }
    loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: Boolean(profile?.is_admin),
    loading,
    profileLoading,
    profileFailed,
    retryProfile: () => {
      if (session?.user) loadProfile(session.user.id);
    },
    // For "I just successfully wrote this field myself, reflect it in the
    // shared profile immediately" — a synchronous local patch, not a
    // network refetch. Deliberately distinct from retryProfile: that one
    // sets profileLoading, which AccountGate (App.jsx) treats as "we don't
    // know this account's role yet" and responds to by unmounting whatever
    // dashboard is currently showing in favor of a "Checking access…"
    // placeholder — appropriate for an actual failed/unknown state, but not
    // for a routine save while already looking at a page that only exists
    // because the role was already known. Using retryProfile here for a
    // full_name update caused exactly that: saving your name mid-session
    // briefly tore down and remounted the whole dashboard, so the "✓
    // Saved" confirmation never had a chance to render before its own
    // component was unmounted.
    setLocalProfile: (patch) => setProfile((prev) => (prev ? { ...prev, ...patch } : prev)),
    // emailRedirectTo matters here for the same reason it's already set
    // on the password-reset request below: without it, the confirmation
    // link falls back to whatever "Site URL" happens to be configured in
    // the Supabase dashboard — often still the default placeholder from
    // project creation — rather than wherever this site is actually
    // running. That mismatch is exactly what makes a real confirmation
    // email link fail with "Safari can't open the page" on a real device.
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      }),
    // The flag has to be written before signInWithPassword runs, since
    // that call is what triggers the storage adapter's setItem for the
    // resulting session — writing it after would be one call too late.
    signIn: (email, password, rememberMe = true) => {
      try {
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
      } catch {
        // No localStorage access — the adapter's own default (remembered)
        // applies either way.
      }
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: () => supabase.auth.signOut(),
    // Same redirectTo pattern as signUp/requestPasswordReset above, for the
    // same reason: without it, Google sends the visitor back to whatever
    // "Site URL" happens to be configured in the Supabase dashboard rather
    // than wherever this site is actually running.
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
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
