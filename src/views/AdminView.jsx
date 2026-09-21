import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer,
  Package,
  Gem,
  ChevronRight,
  Truck,
  CheckCircle2,
  Plus,
  Send,
  LayoutDashboard,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow } from '../lib/mapProduct';
import { parsePesoToNumber, formatPeso } from '../lib/currency';
import { COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDER_STAGES } from '../data/orders';
import { FILTER_TABS } from '../data/products';

const TABS = [
  { id: 'commissions', label: 'Commission Pipeline', icon: Hammer },
  { id: 'orders', label: 'Order Fulfillment', icon: Package },
  { id: 'inventory', label: 'Inventory & Site Curation', icon: Gem },
];

function stageIndex(stages, id) {
  const i = stages.findIndex((s) => s.id === id);
  return i === -1 ? 0 : i;
}

function StatusBadge({ label, tone = 'neutral' }) {
  const toneClass =
    tone === 'done'
      ? 'bg-olive/15 text-olive'
      : tone === 'active'
      ? 'bg-chile-rojo/10 text-chile-rojo'
      : 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${toneClass}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow-cloud-sm p-5">
      <div className="w-11 h-11 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-serif text-on-surface leading-none">{value}</p>
        <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Commission Pipeline                                                  */
/* ------------------------------------------------------------------ */
function CommissionPipeline({ briefs, onUpdated }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [saving, setSaving] = useState(null);
  const [signedImages, setSignedImages] = useState({});

  // Reference images live in a private bucket (only admins can read them),
  // so each brief's paths need a fresh signed URL rather than a public one.
  useEffect(() => {
    const briefsWithImages = briefs.filter((b) => b.reference_image_urls?.length);
    if (briefsWithImages.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        briefsWithImages.map(async (b) => {
          const { data } = await supabase.storage
            .from('commission-references')
            .createSignedUrls(b.reference_image_urls, 3600);
          return [b.id, (data ?? []).filter((d) => d.signedUrl).map((d) => d.signedUrl)];
        })
      );
      if (!cancelled) setSignedImages(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [briefs]);

  const advance = async (id, nextStatus, extra = {}) => {
    setSaving(id);
    const { error } = await supabase
      .from('commission_briefs')
      .update({ status: nextStatus, ...extra })
      .eq('id', id);
    setSaving(null);
    if (error) {
      alert(`Couldn't update that brief: ${error.message}`);
      return;
    }
    onUpdated();
  };

  const sendQuote = (brief) => {
    const raw = quoteDrafts[brief.id] ?? '';
    const cents = Math.round(parsePesoToNumber(raw) * 100);
    advance(brief.id, 'quote_sent', { quote_price_cents: cents || null });
  };

  const visible =
    statusFilter === 'all' ? briefs : briefs.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
            statusFilter === 'all' ? 'bg-on-surface text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          All
        </button>
        {COMMISSION_STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
              statusFilter === s.id ? 'bg-on-surface text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((brief) => {
          const idx = stageIndex(COMMISSION_STAGES, brief.status);
          const isDelivered = brief.status === 'delivered';
          const isSaving = saving === brief.id;
          return (
            <div key={brief.id} className="bg-white rounded-2xl shadow-cloud-sm p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg text-on-surface">{brief.full_name}</h3>
                    <StatusBadge
                      label={COMMISSION_STAGES[idx].label}
                      tone={isDelivered ? 'done' : 'active'}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {brief.email} • {brief.category} • {brief.material}
                  </p>
                  {brief.narrative && (
                    <p className="text-sm text-on-surface/80 mt-3 leading-relaxed max-w-2xl">
                      {brief.narrative}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-on-surface-variant">
                    {brief.budget_range && <span>Budget: {brief.budget_range}</span>}
                    {brief.timeline && <span>Timeline: {brief.timeline}</span>}
                    {!brief.reference_image_urls?.length && <span>0 reference images</span>}
                    <span>Submitted {new Date(brief.created_at).toLocaleDateString()}</span>
                    {brief.quote_price_cents != null && (
                      <span>Quote: {formatPeso(brief.quote_price_cents / 100)}</span>
                    )}
                  </div>
                  {signedImages[brief.id]?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {signedImages[brief.id].map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`Reference ${i + 1}`}
                            className="w-14 h-14 rounded-xl object-cover shadow-cloud-sm hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pipeline action, one step ahead of the current status */}
                <div className="flex-shrink-0 w-full sm:w-56">
                  {brief.status === 'brief_submitted' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Quote price (e.g. ₱50,000)"
                        value={quoteDrafts[brief.id] ?? ''}
                        onChange={(e) =>
                          setQuoteDrafts((prev) => ({ ...prev, [brief.id]: e.target.value }))
                        }
                        className="w-full rounded-full bg-surface-container-low px-4 py-2 text-xs text-on-surface border-none outline-none focus:bg-white shadow-input-inset"
                      />
                      <button
                        onClick={() => sendQuote(brief)}
                        disabled={isSaving}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-chile-rojo text-white flex items-center justify-center border-none cursor-pointer hover:brightness-90 disabled:opacity-50"
                        aria-label="Send quote"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {brief.status === 'quote_sent' && (
                    <button
                      onClick={() => advance(brief.id, 'in_production', { deposit_paid: true })}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50"
                    >
                      Deposit Received → Production
                    </button>
                  )}
                  {brief.status === 'in_production' && (
                    <button
                      onClick={() => advance(brief.id, 'delivered')}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {isDelivered && (
                    <div className="flex items-center justify-center gap-1.5 text-olive text-xs font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-center text-sm text-on-surface-variant py-12">No briefs in this stage.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order Fulfillment                                                     */
/* ------------------------------------------------------------------ */
function OrderFulfillment({ orders, onUpdated }) {
  const advance = async (order) => {
    const idx = stageIndex(ORDER_STAGES, order.status);
    const next = ORDER_STAGES[idx + 1];
    if (!next) return;
    const trackingNumber =
      next.id === 'shipped' && !order.tracking_number
        ? `PHLPOST-${Math.floor(10000000 + Math.random() * 89999999)}`
        : order.tracking_number;

    const { error } = await supabase
      .from('orders')
      .update({ status: next.id, tracking_number: trackingNumber })
      .eq('id', order.id);
    if (error) {
      alert(`Couldn't update that order: ${error.message}`);
      return;
    }
    onUpdated();
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const idx = stageIndex(ORDER_STAGES, order.status);
        const next = ORDER_STAGES[idx + 1];
        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow-cloud-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg text-on-surface">#{order.id.slice(0, 8)}</h3>
                <StatusBadge label={ORDER_STAGES[idx].label} tone={idx === ORDER_STAGES.length - 1 ? 'done' : 'active'} />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {order.patron?.full_name || order.patron?.email || 'Guest'} •{' '}
                {order.product?.title ?? 'Item unavailable'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-on-surface-variant">
                <span>Total: {formatPeso(order.total_cents / 100)}</span>
                <span>Placed {new Date(order.created_at).toLocaleDateString()}</span>
                {order.tracking_number && <span>Tracking: {order.tracking_number}</span>}
              </div>
            </div>
            {next ? (
              <button
                onClick={() => advance(order)}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all"
              >
                {next.id === 'shipped' ? <Truck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark as {next.label}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-olive text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Complete
              </div>
            )}
          </div>
        );
      })}
      {orders.length === 0 && (
        <p className="text-center text-sm text-on-surface-variant py-12">No orders yet.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory & Site Curation                                            */
/* ------------------------------------------------------------------ */
function InventoryCuration({ pieces, onUpdated }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', category: FILTER_TABS[1], material: '', price: '', image: '' });
  const [saving, setSaving] = useState(false);

  const toggleSoldOut = async (piece) => {
    const { error } = await supabase
      .from('products')
      .update({ sold_out: !piece.soldOut })
      .eq('id', piece.id);
    if (error) {
      alert(`Couldn't update that piece: ${error.message}`);
      return;
    }
    onUpdated();
  };

  const addPiece = async (e) => {
    e.preventDefault();
    if (!draft.title || !draft.price) return;
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      title: draft.title,
      category: draft.category,
      material: draft.material || 'Details TBD',
      description: 'New addition — details to be finalized.',
      price_cents: Math.round(parsePesoToNumber(draft.price) * 100),
      image_url:
        draft.image ||
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80',
      sold_out: false,
    });
    setSaving(false);
    if (error) {
      alert(`Couldn't save that piece: ${error.message}`);
      return;
    }
    setDraft({ title: '', category: FILTER_TABS[1], material: '', price: '', image: '' });
    setShowAddForm(false);
    onUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Piece
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addPiece}
            className="overflow-hidden bg-white rounded-2xl shadow-cloud-sm p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <input
              required
              placeholder="Title *"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            >
              {FILTER_TABS.filter((t) => t !== 'All').map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              placeholder="Material"
              value={draft.material}
              onChange={(e) => setDraft((d) => ({ ...d, material: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <input
              required
              placeholder="Price (e.g. ₱12,000) *"
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <input
              placeholder="Image URL (optional)"
              value={draft.image}
              onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset sm:col-span-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 px-5 py-2.5 rounded-full bg-on-surface text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Piece'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pieces.map((piece) => (
          <div key={piece.id} className="bg-white rounded-2xl shadow-cloud-sm overflow-hidden">
            <div className="relative aspect-square bg-surface-container-low">
              <img src={piece.image} alt={piece.title} className="w-full h-full object-cover" />
              {piece.soldOut && (
                <div className="absolute inset-0 bg-on-surface/60 flex items-center justify-center">
                  <span className="bg-white text-on-surface text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <p className="font-sans text-sm font-medium text-on-surface">{piece.title}</p>
              <p className="text-xs text-on-surface-variant">{piece.category} • {piece.price}</p>
              <button
                onClick={() => toggleSoldOut(piece)}
                className={`w-full mt-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer transition-colors ${
                  piece.soldOut
                    ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    : 'bg-on-surface text-white hover:opacity-90'
                }`}
              >
                {piece.soldOut ? 'Mark Available' : 'Mark Sold Out'}
              </button>
            </div>
          </div>
        ))}
        {pieces.length === 0 && (
          <p className="col-span-full text-center text-sm text-on-surface-variant py-12">
            No pieces yet — add one above.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                  */
/* ------------------------------------------------------------------ */
export default function AdminView() {
  const [activeTab, setActiveTab] = useState('commissions');
  const [briefs, setBriefs] = useState(null);
  const [orders, setOrders] = useState(null);
  const [pieces, setPieces] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('commission_briefs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) setBriefs(error || !data ? [] : data);
      });

    supabase
      .from('orders')
      .select('*, product:products(title), patron:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) setOrders(error || !data ? [] : data);
      });

    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) setPieces(error || !data ? [] : data.map(mapProductRow));
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const newBriefCount = briefs?.filter((b) => b.status === 'brief_submitted').length ?? 0;
  const pendingOrderCount = orders?.filter((o) => o.status !== 'delivered').length ?? 0;
  const soldOutCount = pieces?.filter((p) => p.soldOut).length ?? 0;

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-on-surface">ACUA Admin</h1>
            <p className="text-xs text-on-surface-variant">Owner operations dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Hammer} label="New Briefs Awaiting Review" value={newBriefCount} />
          <StatCard icon={Package} label="Orders In Progress" value={pendingOrderCount} />
          <StatCard icon={Gem} label="Pieces Marked Sold Out" value={soldOutCount} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/30 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
                  isActive ? 'bg-chile-rojo text-white' : 'bg-white text-on-surface hover:bg-surface-container shadow-cloud-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {activeTab === 'commissions' &&
          (briefs === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : (
            <CommissionPipeline briefs={briefs} onUpdated={refresh} />
          ))}
        {activeTab === 'orders' &&
          (orders === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : (
            <OrderFulfillment orders={orders} onUpdated={refresh} />
          ))}
        {activeTab === 'inventory' &&
          (pieces === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : (
            <InventoryCuration pieces={pieces} onUpdated={refresh} />
          ))}
      </div>
    </div>
  );
}
