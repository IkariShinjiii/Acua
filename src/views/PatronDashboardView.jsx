import React, { useEffect, useState } from 'react';
import { Package, Hammer, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDER_STAGES } from '../data/orders';
import { MATERIAL_OPTIONS } from '../data/commissionOptions';

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors border-none bg-transparent cursor-pointer"
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

export default function PatronDashboardView({ setCurrentView, initialTab }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab ?? 'orders');
  const [orders, setOrders] = useState(null);
  const [briefs, setBriefs] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from('orders')
      .select('*, product:products(title, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setOrders(data ?? []);
      });

    supabase
      .from('commission_briefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setBriefs(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const tabs = [
    { id: 'orders', label: 'Active Purchases', icon: Package },
    { id: 'commissions', label: 'Custom Commissions', icon: Hammer },
  ];

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl text-on-surface">My Dashboard</h1>
          <p className="text-xs text-on-surface-variant mt-1">Signed in as {user?.email}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/30 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
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
            {orders?.length === 0 && (
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
            {briefs === null && <p className="text-sm text-on-surface-variant text-center py-16">Loading…</p>}
            {briefs?.length === 0 && (
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
