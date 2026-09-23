import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Package, Hammer, ShoppingBag, ArrowRight, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDER_STAGES } from '../data/orders';
import { MATERIAL_OPTIONS } from '../data/commissionOptions';
import { parseDeepLinkTab } from '../lib/dashboardTabs';

function stageIndex(stages, id) {
  const i = stages.findIndex((s) => s.id === id);
  return i === -1 ? 0 : i;
}

function StatusBadge({ label, done }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
        done ? 'bg-olive/15 text-olive' : 'bg-chile-rojo/10 text-accent'
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, body, ctaLabel, onCta }) {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center mx-auto">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-serif text-lg text-on-surface">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm mx-auto">{body}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors border-none bg-transparent cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// Pipeline tracker — one dot per stage, filled up to the current one.
function StageTracker({ stages, currentId }) {
  const idx = stageIndex(stages, currentId);
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {stages.map((s, i) => (
        <React.Fragment key={s.id}>
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              i <= idx ? 'bg-chile-rojo' : 'bg-surface-container-high'
            }`}
            title={s.label}
          />
          {i < stages.length - 1 && (
            <div className={`h-px flex-1 ${i < idx ? 'bg-chile-rojo' : 'bg-surface-container-high'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const COMMISSION_POLL_INTERVAL_MS = 2000;
const COMMISSION_POLL_TIMEOUT_MS = 20000;

// Reached after PayMongo redirects back from a deposit/balance payment
// (create-commission-payment's return_url, read by App.jsx and passed
// down as `confirmingCommission`). The brief isn't actually updated yet at
// this point — paymongo-webhook does that asynchronously — so this polls
// for the specific stage's paid timestamp rather than assuming success
// just because the patron landed back here.
function CommissionPaymentBanner({ confirmingCommission, onResolved }) {
  const [outcome, setOutcome] = useState('pending');
  const { id: briefId, stage } = confirmingCommission ?? {};

  useEffect(() => {
    if (!briefId) return undefined;
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const { data, error } = await supabase
        .from('commission_briefs')
        .select('deposit_paid_at, balance_paid_at')
        .eq('id', briefId)
        .single();

      if (cancelled) return;

      const paidAt = stage === 'deposit' ? data?.deposit_paid_at : data?.balance_paid_at;
      if (!error && paidAt) {
        setOutcome('success');
        onResolved();
        return;
      }
      if (Date.now() - startedAt >= COMMISSION_POLL_TIMEOUT_MS) {
        setOutcome('timeout');
        return;
      }
      setTimeout(poll, COMMISSION_POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [briefId, stage, onResolved]);

  if (!briefId) return null;

  if (outcome === 'pending') {
    return (
      <div className="flex items-center gap-3 bg-surface-elevated rounded-2xl shadow-cloud-sm p-4 mb-4">
        <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 border-t-accent animate-spin flex-shrink-0" />
        <p className="text-sm text-on-surface-variant">Confirming your payment…</p>
      </div>
    );
  }

  if (outcome === 'success') {
    return (
      <div className="flex items-center gap-2 bg-olive/10 text-olive rounded-2xl p-4 mb-4 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Payment confirmed — updated below.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-chile-rojo/10 text-accent rounded-2xl p-4 mb-4 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>Still confirming — this is taking a moment longer than usual. Refresh in a bit.</span>
    </div>
  );
}

export default function PatronDashboardView({ setCurrentView, initialTab, confirmingCommission }) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(parseDeepLinkTab(initialTab) ?? 'orders');
  // useState's initial value only applies on the very first mount — deep
  // links triggered while this component is already mounted (e.g. opening
  // the account dropdown and clicking Settings while already viewing
  // Orders) change the initialTab prop without remounting anything, so
  // without this the tab would silently fail to switch. Reactively follows
  // the prop on every change; a direct tab-button click afterward still
  // sticks, since that's a separate state update this effect doesn't touch.
  useEffect(() => {
    setActiveTab(parseDeepLinkTab(initialTab) ?? 'orders');
  }, [initialTab]);
  const [orders, setOrders] = useState(null);
  const [briefs, setBriefs] = useState(null);
  // A failed fetch used to look identical to "you genuinely have none of
  // these" — both just left orders/briefs as []. For a patron checking on
  // something they actually paid for, that's a real trust problem: a
  // transient network hiccup would show "No orders yet" for an order that
  // really did go through, not just cosmetic emptiness like on the public
  // storefront (see plan.md §38, the same bug on Home/product pages).
  const [ordersFailed, setOrdersFailed] = useState(false);
  const [briefsFailed, setBriefsFailed] = useState(false);
  // Which brief's deposit/balance payment is currently being started —
  // guards against a double-click firing two Payment Intents for the same
  // brief, and lets the button show its own inline error rather than a
  // global toast.
  const [payingBriefId, setPayingBriefId] = useState(null);
  // { briefId, message } rather than a bare string — several briefs can be
  // pay-eligible at once, and a failed attempt on one shouldn't surface its
  // error under every other brief's own payment button too.
  const [payError, setPayError] = useState(null);
  // Bumped on every load attempt so a still-in-flight request from a
  // superseded attempt (a stale user, or a "Try Again" retry) can tell
  // it's stale and discard its own result — same pattern as
  // ProductDetailView's loadProduct, immune to React 18 StrictMode's
  // dev-only double-invoke (see plan.md §38's postmortem on a boolean-
  // flag version of this that broke under exactly that).
  const ordersRequestId = useRef(0);
  const briefsRequestId = useRef(0);

  const loadOrders = useCallback(() => {
    if (!user) return;
    const thisRequestId = ++ordersRequestId.current;
    setOrders(null);
    setOrdersFailed(false);
    supabase
      .from('orders')
      .select('*, product:products(title, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (ordersRequestId.current !== thisRequestId) return;
        if (error) {
          setOrdersFailed(true);
          setOrders([]);
          return;
        }
        setOrders(data ?? []);
      })
      .catch(() => {
        if (ordersRequestId.current !== thisRequestId) return;
        setOrdersFailed(true);
        setOrders([]);
      });
  }, [user]);

  const loadBriefs = useCallback(() => {
    if (!user) return;
    const thisRequestId = ++briefsRequestId.current;
    setBriefs(null);
    setBriefsFailed(false);
    supabase
      .from('commission_briefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (briefsRequestId.current !== thisRequestId) return;
        if (error) {
          setBriefsFailed(true);
          setBriefs([]);
          return;
        }
        setBriefs(data ?? []);
      })
      .catch(() => {
        if (briefsRequestId.current !== thisRequestId) return;
        setBriefsFailed(true);
        setBriefs([]);
      });
  }, [user]);

  useEffect(() => {
    loadOrders();
    loadBriefs();
  }, [loadOrders, loadBriefs]);

  const payCommission = async (briefId, stage) => {
    setPayError(null);
    setPayingBriefId(briefId);
    try {
      const { data, error } = await supabase.functions.invoke('create-commission-payment', {
        body: { commission_brief_id: briefId, stage },
      });
      if (error) {
        setPayError({ briefId, message: error.message || 'Something went wrong. Please try again.' });
        setPayingBriefId(null);
        return;
      }
      if (data?.error) {
        setPayError({ briefId, message: data.error });
        setPayingBriefId(null);
        return;
      }
      window.location.assign(data.redirect_url);
    } catch (err) {
      setPayError({
        briefId,
        message: err?.message || 'Something went wrong. Check your connection and try again.',
      });
      setPayingBriefId(null);
    }
  };

  const tabs = [
    { id: 'orders', label: 'Active Purchases', icon: Package },
    { id: 'commissions', label: 'Custom Commissions', icon: Hammer },
  ];

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-on-surface">My Dashboard</h1>
            <p className="text-xs text-on-surface-variant mt-1">Signed in as {user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-accent transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/30 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                  isActive ? 'bg-chile-rojo text-white' : 'bg-surface-elevated text-on-surface hover:bg-surface-container shadow-cloud-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders === null && <p className="text-sm text-on-surface-variant text-center py-16">Loading…</p>}
            {ordersFailed && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="w-5 h-5 text-accent" />
                <p className="text-sm text-on-surface-variant max-w-sm">
                  Couldn't load your orders right now — this is a connection issue on our end, not
                  a sign anything's missing.
                </p>
                <button
                  onClick={loadOrders}
                  className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                >
                  Try Again
                </button>
              </div>
            )}
            {!ordersFailed && orders?.length === 0 && (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                body="Pieces you buy from Available Pieces will show up here with live shipping status."
                ctaLabel="Browse Available Pieces"
                onCta={() => setCurrentView?.('home')}
              />
            )}
            {orders?.map((order) => {
              const idx = stageIndex(ORDER_STAGES, order.status);
              return (
                <div key={order.id} className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {order.product?.image_url && (
                        <img
                          src={order.product.image_url}
                          alt={order.product.title ?? 'Order'}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg text-on-surface truncate">
                          {order.product?.title ?? 'Order'}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          ₱{(order.total_cents / 100).toLocaleString()} • Placed{' '}
                          {new Date(order.created_at).toLocaleDateString()}
                          {order.tracking_number && ` • Tracking: ${order.tracking_number}`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={ORDER_STAGES[idx].label}
                      done={idx === ORDER_STAGES.length - 1}
                    />
                  </div>
                  <StageTracker stages={ORDER_STAGES} currentId={order.status} />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="space-y-4">
            {confirmingCommission && (
              <CommissionPaymentBanner confirmingCommission={confirmingCommission} onResolved={loadBriefs} />
            )}
            {briefs === null && <p className="text-sm text-on-surface-variant text-center py-16">Loading…</p>}
            {briefsFailed && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="w-5 h-5 text-accent" />
                <p className="text-sm text-on-surface-variant max-w-sm">
                  Couldn't load your commissions right now — this is a connection issue on our
                  end, not a sign anything's missing.
                </p>
                <button
                  onClick={loadBriefs}
                  className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                >
                  Try Again
                </button>
              </div>
            )}
            {!briefsFailed && briefs?.length === 0 && (
              <EmptyState
                icon={Hammer}
                title="No custom commissions yet"
                body="Submit a brief and track it here from first sketch to final delivery."
                ctaLabel="Start a Custom Request"
                onCta={() => setCurrentView?.('commission')}
              />
            )}
            {briefs?.map((brief) => {
              const idx = stageIndex(COMMISSION_STAGES, brief.status);
              return (
                <div key={brief.id} className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-serif text-lg text-on-surface">{brief.category}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {MATERIAL_OPTIONS.find((m) => m.id === brief.material)?.label ?? brief.material} •
                        Submitted {new Date(brief.created_at).toLocaleDateString()}
                        {brief.quote_price_cents &&
                          ` • Quote: ₱${(brief.quote_price_cents / 100).toLocaleString()}`}
                      </p>
                    </div>
                    <StatusBadge
                      label={COMMISSION_STAGES[idx].label}
                      done={brief.status === 'delivered'}
                    />
                  </div>
                  {brief.narrative && (
                    <p className="text-sm text-on-surface/80 mt-3 leading-relaxed">{brief.narrative}</p>
                  )}
                  <StageTracker stages={COMMISSION_STAGES} currentId={brief.status} />
                  {(brief.status === 'quote_sent' || brief.status === 'awaiting_balance') &&
                    brief.quote_price_cents &&
                    (() => {
                      const depositCents = Math.round(brief.quote_price_cents / 2);
                      const amountCents =
                        brief.status === 'quote_sent' ? depositCents : brief.quote_price_cents - depositCents;
                      const stage = brief.status === 'quote_sent' ? 'deposit' : 'balance';
                      const isPaying = payingBriefId === brief.id;
                      return (
                        <div className="mt-4 pt-4 border-t border-outline-variant/30">
                          <button
                            onClick={() => payCommission(brief.id, stage)}
                            disabled={isPaying}
                            className="btn-terracotta w-full sm:w-auto justify-center disabled:opacity-50"
                          >
                            {isPaying ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                <span>Starting payment…</span>
                              </div>
                            ) : (
                              `Pay ${stage === 'deposit' ? 'Deposit' : 'Balance'} (₱${(amountCents / 100).toLocaleString()})`
                            )}
                          </button>
                          {payError?.briefId === brief.id && (
                            <p className="flex items-start gap-1.5 text-xs text-accent mt-2">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {payError.message}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
