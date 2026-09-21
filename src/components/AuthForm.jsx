import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Reusable email/password auth form. `mode` sets the initial tab; pass
// `allowSignup={false}` to hide the signup tab entirely (e.g. the admin
// gate, where accounts are provisioned by hand, never self-served).
export default function AuthForm({ mode: initialMode = 'login', allowSignup = true, onSuccess, title, subtitle }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

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

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center mx-auto mb-3">
          {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
        </div>
        <h2 className="font-serif text-2xl text-on-surface">
          {title ?? (mode === 'login' ? 'Log In' : 'Create Account')}
        </h2>
        {subtitle && <p className="text-xs text-on-surface-variant mt-1.5">{subtitle}</p>}
      </div>

      {allowSignup && (
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
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="cloud-input"
        />

        {error && (
          <div className="flex items-start gap-2 text-xs text-chile-rojo bg-chile-rojo/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-terracotta w-full justify-center">
          {submitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
