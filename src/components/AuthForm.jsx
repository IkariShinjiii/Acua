import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Reusable email/password auth form. `mode` sets the initial tab; pass
// `allowSignup={false}` to hide the signup tab entirely (e.g. the admin
// gate, where accounts are provisioned by hand, never self-served).
export default function AuthForm({ mode: initialMode = 'login', allowSignup = true, onSuccess, title, subtitle }) {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'forgot') {
      const { error: resetError } = await requestPasswordReset(email);
      setSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setResetSent(true);
      return;
    }

    const { error: authError } =
      mode === 'signup' ? await signUp(email, password, fullName) : await signIn(email, password);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === 'signup') {
      setSignupSuccess(true);
    } else {
      onSuccess?.();
    }
  };

  if (signupSuccess) {
    return (
      <div className="text-center py-8 space-y-3 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center mx-auto">
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
          className="text-xs font-semibold uppercase tracking-wider text-chile-rojo hover:text-terracota transition-colors"
        >
          Back to log in
        </button>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="text-center py-8 space-y-3 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center mx-auto">
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
          className="text-xs font-semibold uppercase tracking-wider text-chile-rojo hover:text-terracota transition-colors"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center mx-auto mb-3">
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
              className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
                mode === m ? 'bg-white text-on-surface shadow-cloud-sm' : 'text-on-surface-variant bg-transparent'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            required
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="cloud-input"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email Address"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cloud-input"
          />
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
            }}
            className="block text-xs font-medium text-on-surface-variant hover:text-chile-rojo transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Forgot password?
          </button>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-chile-rojo bg-chile-rojo/10 rounded-xl p-3">
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
            className="block mx-auto text-xs font-semibold uppercase tracking-wider text-chile-rojo hover:text-terracota transition-colors bg-transparent border-none cursor-pointer"
          >
            Back to log in
          </button>
        )}
      </form>
    </div>
  );
}
