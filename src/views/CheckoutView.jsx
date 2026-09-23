import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartAvailability } from '../hooks/useCartAvailability';
import { supabase } from '../lib/supabaseClient';
import { formatPeso } from '../lib/currency';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 20000;

// Reached via the ?checkout=<checkout_group_id> return_url PayMongo sends
// the customer back to once they've authorized (or abandoned) payment on
// GCash's own hosted page — App.jsx reads that query param on mount and
// passes it through as `confirmingGroupId`. The order itself isn't
// actually confirmed yet at this point; the paymongo-webhook Edge
// Function does that asynchronously, so this polls for it rather than
// assuming success just because the customer landed back here.
function ConfirmingPayment({ confirmingGroupId, onDone }) {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [outcome, setOutcome] = useState('pending'); // 'pending' | 'success' | 'failed' | 'timeout'

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('checkout_group_id', confirmingGroupId)
        .eq('user_id', user.id);

      if (cancelled) return;

      if (!error && data && data.length > 0 && data.every((o) => o.status !== 'awaiting_payment')) {
        clearCart();
        setOutcome('success');
        return;
      }
      if (!error && data && data.length === 0) {
        setOutcome('failed');
        return;
      }
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setOutcome('timeout');
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmingGroupId]);

  if (outcome === 'pending') {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-outline-variant/40 border-t-accent animate-spin" />
        <p className="text-sm text-on-surface-variant">Confirming your payment…</p>
      </div>
    );
  }

  if (outcome === 'success') {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-olive/10 text-olive flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl text-on-surface">Order placed!</h2>
        <p className="text-sm text-on-surface-variant">
          Your payment went through and your order is confirmed. Track it any time from My
          Dashboard.
        </p>
        <button onClick={onDone} className="btn-terracotta">
          Go to My Dashboard
        </button>
      </div>
    );
  }

  if (outcome === 'failed') {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl text-on-surface">Payment didn't go through</h2>
        <p className="text-sm text-on-surface-variant">
          Nothing was charged and your order wasn't placed. Your cart is still here — you can try
          again.
        </p>
        <button onClick={onDone} className="btn-terracotta">
          Back to Checkout
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 space-y-4 max-w-md mx-auto">
      <p className="text-sm text-on-surface-variant">
        Still confirming — this is taking longer than usual. Check My Dashboard in a moment, or
        we'll have it sorted shortly.
      </p>
      <button onClick={onDone} className="btn-terracotta">
        Go to My Dashboard
      </button>
    </div>
  );
}

export default function CheckoutView({ setCurrentView, confirmingGroupId }) {
  const { user } = useAuth();
  const { items } = useCart();
  const { soldOutIds, revalidationFailed, availableItems, availableSubtotalCents } =
    useCartAvailability(items, !confirmingGroupId);

  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    zip: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const didAutofill = useRef(false);

  useEffect(() => {
    if (didAutofill.current || !user) return;
    didAutofill.current = true;
    setShipping((prev) => ({ ...prev, name: prev.name || user.user_metadata?.full_name || '' }));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <AuthForm title="Checkout" subtitle="Log in or create an account to place your order." />
      </div>
    );
  }

  if (confirmingGroupId) {
    return (
      <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
          <ConfirmingPayment
            confirmingGroupId={confirmingGroupId}
            onDone={() => setCurrentView('dashboard')}
          />
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      // supabase.functions.invoke() automatically forwards the current
      // session's JWT as the Authorization header — the Edge Function
      // reads it the same way any RLS-protected query would identify the
      // caller.
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: availableItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          shipping,
        },
      });
      if (error) {
        setSubmitError(error.message || 'Something went wrong. Please try again.');
        return;
      }
      if (data?.error) {
        setSubmitError(data.error);
        return;
      }
      window.location.assign(data.redirect_url);
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24 text-center">
          <p className="text-sm text-on-surface-variant">Your cart is empty.</p>
          <button onClick={() => setCurrentView('home')} className="btn-terracotta mt-6">
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        <h1 className="font-serif text-2xl sm:text-3xl text-on-surface mb-8">Checkout</h1>

        <div className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 mb-6 space-y-3">
          {revalidationFailed && (
            <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Couldn't confirm these pieces are still available — this is a connection issue on
                our end. Double-check before paying.
              </span>
            </div>
          )}
          {soldOutIds.size > 0 && (
            <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {soldOutIds.size === 1 ? 'One piece has' : `${soldOutIds.size} pieces have`} sold
                since you added {soldOutIds.size === 1 ? 'it' : 'them'} — excluded below.
              </span>
            </div>
          )}
          {availableItems.map((i) => (
            <div key={i.product.id} className="flex justify-between text-sm">
              <span className="text-on-surface">
                {i.product.title} × {i.quantity}
              </span>
              <span className="text-on-surface-variant">{i.product.price}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-sm pt-3 border-t border-outline-variant/30">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-semibold text-on-surface">
              {formatPeso(availableSubtotalCents / 100)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 space-y-5">
          <h2 className="font-serif text-lg text-on-surface">Shipping details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkout-name" className="text-xs font-medium text-on-surface mb-1.5 block">
                Full Name *
              </label>
              <input
                id="checkout-name"
                type="text"
                name="name"
                required
                value={shipping.name}
                onChange={handleChange}
                className="cloud-input"
              />
            </div>
            <div>
              <label htmlFor="checkout-phone" className="text-xs font-medium text-on-surface mb-1.5 block">
                Phone Number *
              </label>
              <input
                id="checkout-phone"
                type="text"
                name="phone"
                required
                value={shipping.phone}
                onChange={handleChange}
                placeholder="+63 900 000 0000"
                className="cloud-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="checkout-address" className="text-xs font-medium text-on-surface mb-1.5 block">
              Street Address *
            </label>
            <input
              id="checkout-address"
              type="text"
              name="address"
              required
              value={shipping.address}
              onChange={handleChange}
              className="cloud-input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="checkout-city" className="text-xs font-medium text-on-surface mb-1.5 block">
                City *
              </label>
              <input
                id="checkout-city"
                type="text"
                name="city"
                required
                value={shipping.city}
                onChange={handleChange}
                className="cloud-input"
              />
            </div>
            <div>
              <label htmlFor="checkout-province" className="text-xs font-medium text-on-surface mb-1.5 block">
                Province *
              </label>
              <input
                id="checkout-province"
                type="text"
                name="province"
                required
                value={shipping.province}
                onChange={handleChange}
                className="cloud-input"
              />
            </div>
            <div>
              <label htmlFor="checkout-zip" className="text-xs font-medium text-on-surface mb-1.5 block">
                ZIP Code *
              </label>
              <input
                id="checkout-zip"
                type="text"
                name="zip"
                required
                value={shipping.zip}
                onChange={handleChange}
                className="cloud-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="checkout-notes" className="text-xs font-medium text-on-surface mb-1.5 block">
              Delivery Notes (optional)
            </label>
            <input
              id="checkout-notes"
              type="text"
              name="notes"
              value={shipping.notes}
              onChange={handleChange}
              placeholder="Landmark, gate code, preferred delivery time…"
              className="cloud-input"
            />
          </div>

          {submitError && (
            <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || availableItems.length === 0}
            className="btn-terracotta w-full justify-center"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Starting payment…</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Pay with GCash</span>
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
