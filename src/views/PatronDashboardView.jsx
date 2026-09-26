import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Package, Hammer, ShoppingBag, ArrowRight, LogOut, AlertCircle, Undo2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDER_STAGES } from '../data/orders';
import { MATERIAL_OPTIONS } from '../data/commissionOptions';
import { fetchCommissionOptions } from '../lib/commissionOptionsFetch';
import { parseDeepLinkTab } from '../lib/dashboardTabs';
import { courierById } from '../data/couriers';

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

const REFUND_STATUS_LABELS = {
  pending: 'Refund requested',
  approved: 'Refund approved — processing',
  rejected: 'Refund declined',
  processed: 'Refunded',
};

// Shown on an order or commission card: either the existing refund's
// status (a request only ever exists once — no way to file a second one
// once there's already a pending/resolved row for the same target), or a
// small toggle-open request form.
function RefundControl({ refund, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (refund) {
    return (
      <div className="mt-3 flex items-start gap-2">
        <StatusBadge label={REFUND_STATUS_LABELS[refund.status] ?? refund.status} done={refund.status === 'processed'} />
        {refund.status === 'rejected' && refund.admin_notes && (
          <p className="text-xs text-on-surface-variant">{refund.admin_notes}</p>
        )}
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError('');
    const ok = await onSubmit(reason.trim());
    setSubmitting(false);
    if (ok) {
      setOpen(false);
      setReason('');
    } else {
      setError("Couldn't send that request — check your connection and try again.");
    }
  };

  return open ? (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea
        required
        rows={2}
        autoFocus
        placeholder="Why are you requesting a refund?"
        aria-label="Refund reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-xl bg-surface-container-low px-3.5 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset resize-none"
      />
      {error && <p className="text-xs text-accent">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !reason.trim()}
          className="px-4 py-2 rounded-full bg-chile-rojo text-white text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          {submitting ? 'Sending…' : 'Send Request'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-accent transition-colors py-2 -my-2 border-none bg-transparent cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
    >
      <Undo2 className="w-3.5 h-3.5" /> Request a Refund
    </button>
  );
}

export default function PatronDashboardView({ setCurrentView, initialTab }) {
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
  const [refunds, setRefunds] = useState(null);
  // Admin-editable (see AdminView's Commission Options tab); starts from
  // the hardcoded defaults so a brief's material label renders instantly,
  // same fallback approach as CommissionView's own copy of this fetch.
  const [materials, setMaterials] = useState(MATERIAL_OPTIONS);
  useEffect(() => {
    let cancelled = false;
    fetchCommissionOptions().then((result) => {
      if (cancelled || !result) return;
      setMaterials(result.materials);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  // A failed fetch used to look identical to "you genuinely have none of
  // these" — both just left orders/briefs as []. For a patron checking on
  // something they actually paid for, that's a real trust problem: a
  // transient network hiccup would show "No orders yet" for an order that
  // really did go through, not just cosmetic emptiness like on the public
  // storefront (see plan.md §38, the same bug on Home/product pages).
  const [ordersFailed, setOrdersFailed] = useState(false);
  const [briefsFailed, setBriefsFailed] = useState(false);
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

  // Failures here are silent (no error banner of its own) -- a refund
  // request/status is secondary to the order or commission it's attached
  // to, and every order/commission card already tolerates `refunds` being
  // null (RefundControl just doesn't render until it resolves) rather
  // than needing a dedicated failure state for a non-critical fetch.
  const loadRefunds = useCallback(() => {
    if (!user) return;
    supabase
      .from('refunds')
      .select('id, order_id, commission_brief_id, status, admin_notes')
      .eq('user_id', user.id)
      .then(({ data }) => setRefunds(data ?? []))
      .catch(() => setRefunds([]));
  }, [user]);

  useEffect(() => {
    loadOrders();
    loadBriefs();
    loadRefunds();
  }, [loadOrders, loadBriefs, loadRefunds]);

  const refundFor = (orderId, commissionBriefId) =>
    refunds?.find((r) => (orderId ? r.order_id === orderId : r.commission_brief_id === commissionBriefId));

  const requestRefund = async (reason, { orderId, commissionBriefId }) => {
    const { error } = await supabase.from('refunds').insert({
      order_id: orderId ?? null,
      commission_brief_id: commissionBriefId ?? null,
      user_id: user.id,
      reason,
    });
    if (error) return false;
    loadRefunds();
    return true;
  };

  const tabs = [
    { id: 'orders', label: 'Active Purchases', icon: Package },
    { id: 'commissions', label: 'Custom Commissions', icon: Hammer },
  ];

  return (
    <main className="min-h-screen bg-sand text-on-surface font-sans antialiased">
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
              const courier = courierById(order.courier);
              const trackingUrl = courier?.trackingUrl?.(order.tracking_number ?? '');
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
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {courier?.label ?? 'Tracking'}:{' '}
                            {trackingUrl ? (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent underline underline-offset-2 hover:text-terracota transition-colors"
                              >
                                {order.tracking_number}
                              </a>
                            ) : (
                              order.tracking_number
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge
                      label={ORDER_STAGES[idx].label}
                      done={idx === ORDER_STAGES.length - 1}
                    />
                  </div>
                  <StageTracker stages={ORDER_STAGES} currentId={order.status} />
                  <RefundControl
                    refund={refundFor(order.id, null)}
                    onSubmit={(reason) => requestRefund(reason, { orderId: order.id })}
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="space-y-4">
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
                        {materials.find((m) => m.id === brief.material)?.label ?? brief.material} •
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
                  <RefundControl
                    refund={refundFor(null, brief.id)}
                    onSubmit={(reason) => requestRefund(reason, { commissionBriefId: brief.id })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
