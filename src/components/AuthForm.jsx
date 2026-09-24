import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Google's own four-color "G" mark, per their brand guidelines for
// third-party sign-in buttons — not a lucide icon, since lucide has no
// brand logos.
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// Reusable email/password auth form. `mode` sets the initial tab; pass
// `allowSignup={false}` to hide the signup tab entirely (e.g. the admin
// gate, where accounts are provisioned by hand, never self-served).
export default function AuthForm({ mode: initialMode = 'login', allowSignup = true, onSuccess, title, subtitle }) {
  const { signIn, signUp, requestPasswordReset, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Defaults to checked — matches how the site already behaved for every
  // existing user before this existed (an indefinitely persisted session).
  // Unchecking is the opt-in toward more privacy on a shared device, not
  // the other way around.
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      const { error: oauthError } = await signInWithGoogle();
      // On success this never resolves in a way that matters here — the
      // browser navigates away to Google before this promise would settle.
      // Only a synchronous failure (e.g. the provider isn't enabled yet)
      // actually reaches this branch.
      if (oauthError) {
        setError(oauthError.message);
        setGoogleSubmitting(false);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Check your connection and try again.');
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // See the same guard in CommissionView.handleSubmit — an unexpected
    // throw here (rather than the usual resolved { error }) would otherwise
    // skip setSubmitting(false) and leave the button stuck disabled.
    try {
      if (mode === 'forgot') {
        const { error: resetError } = await requestPasswordReset(email);
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setResetSent(true);
        return;
      }

      if (mode === 'signup' && password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }

      const { error: authError } =
        mode === 'signup' ? await signUp(email, password, fullName) : await signIn(email, password, rememberMe);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (mode === 'signup') {
        setSignupSuccess(true);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="text-center py-8 space-y-3 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
          <UserPlus className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl text-on-surface">Check your email</h3>
        <p className="text-sm text-on-surface-variant">
          We sent a confirmation link to <strong className="text-on-surface">{email}</strong>. Confirm it, then log in.
        </p>
        <button
          onClick={() => {
            setSignupSuccess(false);
            setMode('login');
          }}
          className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          Back to log in
        </button>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="text-center py-8 space-y-3 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl text-on-surface">Check your email</h3>
        <p className="text-sm text-on-surface-variant">
          If an account exists for <strong className="text-on-surface">{email}</strong>, we sent a link to
          reset the password. Open it on this device to set a new one.
        </p>
        <button
          onClick={() => {
            setResetSent(false);
            setMode('login');
          }}
          className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto mb-3">
          {mode === 'login' ? (
            <LogIn className="w-5 h-5" />
          ) : mode === 'forgot' ? (
            <KeyRound className="w-5 h-5" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
        </div>
        <h2 className="font-serif text-2xl text-on-surface">
          {mode === 'forgot' ? 'Reset Password' : title ?? (mode === 'login' ? 'Log In' : 'Create Account')}
        </h2>
        {(subtitle || mode === 'forgot') && (
          <p className="text-xs text-on-surface-variant mt-1.5">
            {mode === 'forgot' ? "We'll email you a link to set a new one." : subtitle}
          </p>
        )}
      </div>

      {allowSignup && mode !== 'forgot' && (
        <div className="flex gap-2 mb-6 bg-surface-container rounded-full p-1">
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container ${
                mode === m ? 'bg-surface-elevated text-on-surface shadow-cloud-sm' : 'text-on-surface-variant bg-transparent'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>
      )}

      {/* Hidden on the admin gate (allowSignup=false) — that screen exists
          specifically because admin accounts are provisioned by hand, never
          self-served, and Google sign-in is exactly the kind of self-service
          account creation that page is deliberately without. Also hidden on
          the forgot-password screen, where it doesn't apply. */}
      {allowSignup && mode !== 'forgot' && (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-full bg-surface-elevated text-on-surface text-sm font-medium shadow-cloud-sm hover:bg-surface-container transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            <GoogleIcon />
            {googleSubmitting ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            required
            placeholder="Full Name"
            aria-label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="cloud-input"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email Address"
          aria-label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="cloud-input"
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cloud-input"
          />
        )}
        {mode === 'signup' && (
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="cloud-input"
          />
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 py-3 -my-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-chile-rojo cursor-pointer"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError('');
              }}
              className="text-xs font-medium text-on-surface-variant hover:text-accent transition-colors bg-transparent border-none cursor-pointer px-0 py-3 -my-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-terracotta w-full justify-center">
          {submitting
            ? 'Please wait…'
            : mode === 'forgot'
            ? 'Send Reset Link'
            : mode === 'login'
            ? 'Log In'
            : 'Create Account'}
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className="block mx-auto text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            Back to log in
          </button>
        )}
      </form>
    </div>
  );
}
