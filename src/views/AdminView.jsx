import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer,
  Package,
  Gem,
  Archive,
  ChevronRight,
  Truck,
  CheckCircle2,
  Plus,
  Send,
  Trash2,
  LayoutDashboard,
  LogOut,
  AlertCircle,
  Pencil,
  Image,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mapProductRow, mapArchiveRow } from '../lib/mapProduct';
import { parsePesoToNumber, formatPeso } from '../lib/currency';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ImagePicker from '../components/ImagePicker';
import { parseDeepLinkTab } from '../lib/dashboardTabs';
import { COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDER_STAGES } from '../data/orders';
import { FILTER_TABS } from '../data/products';
import { JEWELRY_CATEGORIES, MATERIAL_OPTIONS } from '../data/commissionOptions';

const TABS = [
  { id: 'commissions', label: 'Commission Pipeline', icon: Hammer },
  { id: 'orders', label: 'Order Fulfillment', icon: Package },
  { id: 'inventory', label: 'Inventory & Site Curation', icon: Gem },
  { id: 'archive', label: 'The Archive', icon: Archive },
  { id: 'hero', label: 'Homepage Hero', icon: Image },
];

function stageIndex(stages, id) {
  const i = stages.findIndex((s) => s.id === id);
  return i === -1 ? 0 : i;
}

// A genuine network-level drop was confirmed live (see plan.md §78) to
// leave a supabase-js query's own promise permanently pending — neither
// resolving with an error nor rejecting. For most fetches that just means
// a stuck loading spinner, but CommissionPipeline/OrderFulfillment's
// busy-guard fix specifically waits for THIS refetch to land before
// re-enabling its "Mark as X" button (see their own comments) — if it
// never lands, that button stays disabled forever with no way to retry
// short of a full reload. Racing every query here against a bounded
// timeout means a hang degrades to the same visible "couldn't load"
// state a real error already produces, instead of hanging indefinitely.
const FETCH_TIMEOUT_MS = 10000;
function withTimeout(promise) {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ data: null, error: { message: 'Timed out' } }), FETCH_TIMEOUT_MS)
  );
  // A genuine rejection (as opposed to a hang) still needs to resolve the
  // race to *something* the caller's .then(({ data, error }) => ...) can
  // read — otherwise it's just an unhandled rejection instead.
  return Promise.race([promise, timeout]).catch((err) => ({ data: null, error: err }));
}

function StatusBadge({ label, tone = 'neutral' }) {
  const toneClass =
    tone === 'done'
      ? 'bg-olive/15 text-olive'
      : tone === 'active'
      ? 'bg-chile-rojo/10 text-accent'
      : 'bg-surface-container-high text-on-surface-variant';
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${toneClass}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-surface-elevated rounded-2xl shadow-cloud-sm p-5">
      <div className="w-11 h-11 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-serif text-on-surface leading-none">{value ?? '—'}</p>
        <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}

// A failed fetch and a genuinely empty tab used to look identical here —
// both just landed on "No X yet." That's a false alarm for the one
// person actually running the store, not a cosmetic empty state, so it
// gets its own honest message instead of quietly reusing the empty-state
// copy.
function AdminTabError({ label, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle className="w-5 h-5 text-accent" />
      <p className="text-sm text-on-surface-variant max-w-sm">
        Couldn't load {label} right now — this is a connection issue on our end, not a sign
        anything's missing.
      </p>
      <button
        onClick={onRetry}
        className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-terracota transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
      >
        Try Again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Commission Pipeline                                                  */
/* ------------------------------------------------------------------ */
function CommissionPipeline({ briefs, onUpdated, showToast }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [saving, setSaving] = useState(null);
  const [signedImages, setSignedImages] = useState({});
  // Same race OrderFulfillment had (see plan.md §72, and its comment
  // below): onUpdated() triggers a refetch that's what actually updates
  // this brief's status/quote — a separate async round trip from advance()
  // itself resolving. Clearing `saving` the instant the mutation succeeds
  // (rather than once that refetch has landed) re-enables the button while
  // it's still showing the OLD stage, and a click landing in that gap
  // replays the same transition — for sendQuote specifically, with
  // whatever price is currently typed, which can genuinely differ between
  // the two clicks and silently overwrite with the wrong one.
  const previousBriefsRef = useRef(briefs);

  useEffect(() => {
    if (briefs !== previousBriefsRef.current) {
      previousBriefsRef.current = briefs;
      setSaving(null);
    }
  }, [briefs]);

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

  const advance = async (id, nextStatus, extra = {}, successMessage) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('commission_briefs')
        .update({ status: nextStatus, ...extra })
        .eq('id', id);
      if (error) {
        showToast(`Couldn't update that brief: ${error.message}`, 'error');
        setSaving(null); // failure: no refetch is coming to clear this otherwise
        return;
      }
      if (successMessage) showToast(successMessage, 'success');
      onUpdated(); // saving clears once the refetch it triggers actually lands (see effect above)
    } catch (err) {
      showToast(`Couldn't update that brief: ${err?.message || 'check your connection and try again.'}`, 'error');
      setSaving(null);
    }
  };

  const sendQuote = (brief) => {
    const raw = quoteDrafts[brief.id] ?? '';
    const cents = Math.round(parsePesoToNumber(raw) * 100);
    advance(brief.id, 'quote_sent', { quote_price_cents: cents || null }, 'Quote sent.');
  };

  const visible =
    statusFilter === 'all' ? briefs : briefs.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
            statusFilter === 'all' ? 'bg-ink text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          All
        </button>
        {COMMISSION_STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
              statusFilter === s.id ? 'bg-ink text-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
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
            <div key={brief.id} className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6">
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
                    {brief.email} • {brief.category} •{' '}
                    {MATERIAL_OPTIONS.find((m) => m.id === brief.material)?.label ?? brief.material}
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
                            loading="lazy"
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
                        aria-label={`Quote price for ${brief.full_name}`}
                        value={quoteDrafts[brief.id] ?? ''}
                        onChange={(e) =>
                          setQuoteDrafts((prev) => ({ ...prev, [brief.id]: e.target.value }))
                        }
                        className="w-full rounded-full bg-surface-container-low px-4 py-2 text-xs text-on-surface border-none outline-none focus:bg-surface-elevated shadow-input-inset"
                      />
                      <button
                        onClick={() => sendQuote(brief)}
                        disabled={isSaving}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-chile-rojo text-white flex items-center justify-center border-none cursor-pointer hover:brightness-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                        aria-label="Send quote"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {brief.status === 'quote_sent' && (
                    <button
                      onClick={() => advance(brief.id, 'in_production', { deposit_paid: true }, 'Moved to production.')}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                    >
                      Deposit Received → Production
                    </button>
                  )}
                  {brief.status === 'in_production' && (
                    <button
                      onClick={() => advance(brief.id, 'delivered', {}, 'Marked as delivered.')}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
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
function OrderFulfillment({ orders, onUpdated, showToast }) {
  // Missing before: with no busy guard, double-clicking "Mark as Shipped"
  // before the first request round-tripped fired two independent advance()
  // calls, each generating its own random tracking number from the same
  // stale order.status/tracking_number — whichever response landed last
  // silently overwrote the other's tracking number with no sign that two
  // requests had even happened. Matches CommissionPipeline's existing
  // saving/disabled pattern below rather than inventing a new one.
  const [saving, setSaving] = useState(null);
  // Deliberately NOT cleared unconditionally in advance()'s own finally —
  // see the effect below for why. Tracked here so it survives across the
  // parent's refetch.
  const previousOrdersRef = useRef(orders);

  // onUpdated() (called on success, below) triggers AdminView's own
  // top-level refetch of all four datasets, which is what actually updates
  // this order's status and therefore its *next* stage/button label — but
  // that refetch is a separate async round trip, not something advance()
  // can await here. Clearing `saving` unconditionally the moment advance()
  // itself resolves (the original version of this fix) re-enabled the
  // button — still showing the *old* label — for the entire gap between
  // "the mutation succeeded" and "the refreshed order.status actually
  // arrived," and a click landing in that exact gap replayed the same
  // transition with a new random tracking number, the identical bug this
  // whole fix exists to prevent. Waiting for a genuinely new `orders`
  // reference (i.e. the refetch has actually landed) closes that gap: the
  // button only re-enables once its label already reflects the new stage.
  useEffect(() => {
    if (orders !== previousOrdersRef.current) {
      previousOrdersRef.current = orders;
      setSaving(null);
    }
  }, [orders]);

  const advance = async (order) => {
    const idx = stageIndex(ORDER_STAGES, order.status);
    const next = ORDER_STAGES[idx + 1];
    if (!next) return;
    const trackingNumber =
      next.id === 'shipped' && !order.tracking_number
        ? `PHLPOST-${Math.floor(10000000 + Math.random() * 89999999)}`
        : order.tracking_number;

    setSaving(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: next.id, tracking_number: trackingNumber })
        .eq('id', order.id);
      if (error) {
        showToast(`Couldn't update that order: ${error.message}`, 'error');
        setSaving(null); // failure: no refetch is coming to clear this otherwise
        return;
      }
      showToast(`Order marked as ${next.label.toLowerCase()}.`, 'success');
      onUpdated(); // saving clears once the refetch it triggers actually lands (see effect above)
    } catch (err) {
      showToast(`Couldn't update that order: ${err?.message || 'check your connection and try again.'}`, 'error');
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const idx = stageIndex(ORDER_STAGES, order.status);
        const next = ORDER_STAGES[idx + 1];
        const isSaving = saving === order.id;
        return (
          <div
            key={order.id}
            className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                disabled={isSaving}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
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
const EMPTY_PRODUCT = {
  title: '',
  category: FILTER_TABS[1],
  material: '',
  price: '',
  description: '',
  image: '',
  isOneOfOne: false,
};

const fieldClass =
  'rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset';

// Shared by "Add New Piece" and each piece's Edit button, so both collect
// the same fields: until now a new piece couldn't be given a description
// (every one went live as "New addition — details to be finalized.") and an
// existing piece's name, price, photo or text could only be changed by
// editing the database by hand.
function ProductForm({ initial, submitLabel, saving, onSubmit, onCancel, isNew }) {
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <input required placeholder="Title *" aria-label="Title" value={draft.title} onChange={set('title')} className={fieldClass} />
      <select value={draft.category} onChange={set('category')} aria-label="Category" className={fieldClass}>
        {FILTER_TABS.filter((t) => t !== 'All').map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input placeholder="Material" aria-label="Material" value={draft.material} onChange={set('material')} className={fieldClass} />
      <input
        required
        placeholder="Price (e.g. ₱12,000) *"
        aria-label="Price"
        value={draft.price}
        onChange={set('price')}
        className={fieldClass}
      />
      <textarea
        placeholder="Description — what it's made of, how it wears, what makes it special"
        aria-label="Description"
        rows={3}
        value={draft.description}
        onChange={set('description')}
        className={`${fieldClass} sm:col-span-2 resize-y`}
      />
      <ImagePicker
        value={draft.image}
        onChange={(url) => setDraft((d) => ({ ...d, image: url }))}
        onUploadingChange={setUploading}
        required
      />
      {isNew && (
        <label className="sm:col-span-2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-low text-sm text-on-surface cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.isOneOfOne}
            onChange={(e) => setDraft((d) => ({ ...d, isOneOfOne: e.target.checked }))}
            className="w-4 h-4 accent-chile-rojo cursor-pointer"
          />
          This is a 1-of-1 unique piece (only one unit will ever be sold)
        </label>
      )}
      <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="sm:flex-1 px-5 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || uploading}
          className="sm:flex-1 px-5 py-2.5 rounded-full bg-ink text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          {saving ? 'Saving…' : uploading ? 'Waiting for photo…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function InventoryCuration({ pieces, onUpdated, showToast }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggleSoldOut = async (piece) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ sold_out: !piece.soldOut })
        .eq('id', piece.id);
      if (error) {
        showToast(`Couldn't update that piece: ${error.message}`, 'error');
        return;
      }
      showToast(piece.soldOut ? 'Marked available again.' : 'Marked sold out.', 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't update that piece: ${err?.message || 'check your connection and try again.'}`, 'error');
    }
  };

  const toggleOneOfOne = async (piece) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_one_of_one: !piece.isOneOfOne })
        .eq('id', piece.id);
      if (error) {
        showToast(`Couldn't update that piece: ${error.message}`, 'error');
        return;
      }
      showToast(piece.isOneOfOne ? 'No longer marked 1-of-1.' : 'Marked as a 1-of-1 piece.', 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't update that piece: ${err?.message || 'check your connection and try again.'}`, 'error');
    }
  };

  // Shared validation + column mapping for add and edit. Returns null (after
  // a toast) when the form isn't valid.
  const toColumns = (draft) => {
    // parsePesoToNumber returns 0 for any string it can't find a number in
    // (e.g. "TBD" or a stray letter), which used to sail straight through as
    // a legitimate ₱0 price with no warning — a typo in this field silently
    // published a free piece.
    const priceValue = parsePesoToNumber(draft.price);
    if (priceValue <= 0) {
      showToast('Enter a valid price, e.g. ₱12,000.', 'error');
      return null;
    }
    if (!draft.image) {
      showToast('Add a photo of the piece first.', 'error');
      return null;
    }
    return {
      title: draft.title.trim(),
      category: draft.category,
      material: draft.material.trim() || 'Details TBD',
      description: draft.description.trim() || null,
      price_cents: Math.round(priceValue * 100),
      image_url: draft.image,
    };
  };

  const addPiece = async (draft) => {
    const columns = toColumns(draft);
    if (!columns) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert({ ...columns, sold_out: false, is_one_of_one: draft.isOneOfOne });
      if (error) {
        showToast(`Couldn't save that piece: ${error.message}`, 'error');
        return;
      }
      setShowAddForm(false);
      showToast(`"${columns.title}" added to Available Pieces.`, 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't save that piece: ${err?.message || 'check your connection and try again.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePiece = async (piece, draft) => {
    const columns = toColumns(draft);
    if (!columns) return;
    // A replaced photo's old fallback URL would be a different piece's
    // stock image, so it's cleared rather than kept as the backup.
    if (columns.image_url !== piece.image) columns.fallback_image_url = null;
    setSaving(true);
    try {
      const { error } = await supabase.from('products').update(columns).eq('id', piece.id);
      if (error) {
        showToast(`Couldn't save your changes: ${error.message}`, 'error');
        return;
      }
      setEditingId(null);
      showToast(`"${columns.title}" updated.`, 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't save your changes: ${err?.message || 'check your connection and try again.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          <Plus className="w-4 h-4" /> Add New Piece
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <ProductForm
              initial={EMPTY_PRODUCT}
              submitLabel="Save Piece"
              saving={saving}
              onSubmit={addPiece}
              onCancel={() => setShowAddForm(false)}
              isNew
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pieces.map((piece) =>
          editingId === piece.id ? (
            <div key={piece.id} className="col-span-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                Editing "{piece.title}"
              </p>
              <ProductForm
                initial={{
                  title: piece.title,
                  category: piece.category,
                  material: piece.material === 'Details TBD' ? '' : piece.material ?? '',
                  price: piece.price,
                  description: piece.description ?? '',
                  image: piece.image ?? '',
                  isOneOfOne: piece.isOneOfOne,
                }}
                submitLabel="Save Changes"
                saving={saving}
                onSubmit={(draft) => savePiece(piece, draft)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={piece.id} className="bg-surface-elevated rounded-2xl shadow-cloud-sm overflow-hidden">
              <div className="relative aspect-square bg-surface-container-low">
                <img src={piece.image} alt={piece.title} className="w-full h-full object-cover" loading="lazy" />
                {piece.isOneOfOne && (
                  <span className="absolute top-3 left-3 bg-chile-rojo text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    1-of-1
                  </span>
                )}
                {piece.soldOut && (
                  <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                    <span className="bg-surface-elevated text-on-surface text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium text-on-surface">{piece.title}</p>
                    <p className="text-xs text-on-surface-variant">{piece.category} • {piece.price}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(piece.id);
                    }}
                    aria-label={`Edit ${piece.title}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer hover:bg-surface-container-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => toggleSoldOut(piece)}
                    className={`flex-1 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated ${
                      piece.soldOut
                        ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        : 'bg-ink text-white hover:opacity-90'
                    }`}
                  >
                    {piece.soldOut ? 'Mark Available' : 'Mark Sold Out'}
                  </button>
                  <button
                    onClick={() => toggleOneOfOne(piece)}
                    title="Toggle whether only one unit of this piece will ever be sold"
                    className={`flex-1 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated ${
                      piece.isOneOfOne
                        ? 'bg-chile-rojo text-white hover:brightness-90'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {piece.isOneOfOne ? '1-of-1 ✓' : 'Mark 1-of-1'}
                  </button>
                </div>
              </div>
            </div>
          )
        )}
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
/* The Archive                                                          */
/* ------------------------------------------------------------------ */
function ArchiveCuration({ archiveItems, onUpdated, showToast }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    category: JEWELRY_CATEGORIES[0],
    material: MATERIAL_OPTIONS[0].id,
    image: '',
    alt: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  // The item currently awaiting a confirm/cancel decision in the dialog
  // below, or null — replaces window.confirm(), which is exactly the kind
  // of native browser dialog Toast.jsx already moved every other bit of
  // feedback in this app away from.
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const addItem = async (e) => {
    e.preventDefault();
    if (!draft.title) return;
    if (!draft.image) {
      showToast('Add a photo of the piece first.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('archive_items').insert({
        title: draft.title,
        category: draft.category,
        material: draft.material,
        image_url: draft.image,
        alt_text: draft.alt || draft.title,
      });
      if (error) {
        showToast(`Couldn't save that piece: ${error.message}`, 'error');
        return;
      }
      showToast(`"${draft.title}" added to The Archive.`, 'success');
      setDraft({ title: '', category: JEWELRY_CATEGORIES[0], material: MATERIAL_OPTIONS[0].id, image: '', alt: '' });
      setShowAddForm(false);
      onUpdated();
    } catch (err) {
      showToast(`Couldn't save that piece: ${err?.message || 'check your connection and try again.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    const item = pendingRemoval;
    if (!item) return;
    setPendingRemoval(null);
    setDeletingId(item.id);
    try {
      const { error } = await supabase.from('archive_items').delete().eq('id', item.id);
      if (error) {
        showToast(`Couldn't remove that piece: ${error.message}`, 'error');
        return;
      }
      showToast(`"${item.title}" removed.`, 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't remove that piece: ${err?.message || 'check your connection and try again.'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-on-surface-variant max-w-2xl">
        Past 1-of-1 creations shown on the storefront's "The Archive" section — sold, but kept
        as inspiration for "Request Similar Piece" commissions. Every piece here is inherently
        one-of-one; there's no separate flag to set.
      </p>

      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
        >
          <Plus className="w-4 h-4" /> Add Archive Piece
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addItem}
            className="overflow-hidden bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <input
              required
              placeholder="Title *"
              aria-label="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              aria-label="Category"
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset"
            >
              {JEWELRY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={draft.material}
              onChange={(e) => setDraft((d) => ({ ...d, material: e.target.value }))}
              aria-label="Material"
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset sm:col-span-2"
            >
              {MATERIAL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <ImagePicker
              value={draft.image}
              onChange={(url) => setDraft((d) => ({ ...d, image: url }))}
              onUploadingChange={setUploadingImage}
              required
            />
            <input
              placeholder="Image alt text (optional — falls back to title)"
              aria-label="Image alt text"
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset sm:col-span-2"
            />
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="sm:col-span-2 px-5 py-2.5 rounded-full bg-ink text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
            >
              {saving ? 'Saving…' : uploadingImage ? 'Waiting for photo…' : 'Save Piece'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {archiveItems.map((item) => (
          <div key={item.id} className="bg-surface-elevated rounded-2xl shadow-cloud-sm overflow-hidden">
            <div className="relative aspect-square bg-surface-container-low">
              <img src={item.image} alt={item.alt ?? item.title} className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 bg-chile-rojo text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                1-of-1
              </span>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-sans text-sm font-medium text-on-surface">{item.title}</p>
              <p className="text-xs text-on-surface-variant">
                {item.category} • {MATERIAL_OPTIONS.find((m) => m.id === item.material)?.label ?? item.material}
              </p>
              <button
                onClick={() => setPendingRemoval(item)}
                disabled={deletingId === item.id}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer transition-colors bg-surface-container text-accent hover:bg-chile-rojo hover:text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingId === item.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
        {archiveItems.length === 0 && (
          <p className="col-span-full text-center text-sm text-on-surface-variant py-12">
            The Archive is empty — add a past creation above.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title="Remove from The Archive?"
        message={
          pendingRemoval
            ? `Remove "${pendingRemoval.title}" from The Archive? This can't be undone.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}

function HeroCuration({ hero, onUpdated, showToast }) {
  const [draft, setDraft] = useState({
    image: hero.image_url,
    heading: hero.heading,
    subtext: hero.subtext,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!draft.image || !draft.heading || !draft.subtext) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hero_content')
        .update({
          image_url: draft.image,
          heading: draft.heading,
          subtext: draft.subtext,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) {
        showToast(`Couldn't save the hero: ${error.message}`, 'error');
        return;
      }
      showToast('Homepage hero updated.', 'success');
      onUpdated();
    } catch (err) {
      showToast(`Couldn't save the hero: ${err?.message || 'check your connection and try again.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-on-surface-variant max-w-2xl">
        The full-screen image and text at the very top of the homepage. Changes here go live for
        every visitor as soon as you save.
      </p>

      <form
        onSubmit={save}
        className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 grid grid-cols-1 gap-4"
      >
        <ImagePicker
          value={draft.image}
          onChange={(url) => setDraft((d) => ({ ...d, image: url }))}
          onUploadingChange={setUploadingImage}
          required
        />
        <input
          required
          placeholder="Caption (headline) *"
          aria-label="Hero caption"
          value={draft.heading}
          onChange={(e) => setDraft((d) => ({ ...d, heading: e.target.value }))}
          className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset"
        />
        <textarea
          required
          rows={3}
          placeholder="Details (subtext below the caption) *"
          aria-label="Hero details"
          value={draft.subtext}
          onChange={(e) => setDraft((d) => ({ ...d, subtext: e.target.value }))}
          className="rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset resize-none"
        />
        <button
          type="submit"
          disabled={saving || uploadingImage}
          className="justify-self-start px-5 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          {saving ? 'Saving…' : uploadingImage ? 'Waiting for photo…' : 'Save Hero'}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                  */
/* ------------------------------------------------------------------ */
export default function AdminView({ initialTab }) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(parseDeepLinkTab(initialTab) ?? 'commissions');
  // useState's initial value only applies on the very first mount — see
  // the same fix (and its full reasoning) in PatronDashboardView. Without
  // this, clicking Account Settings from the navbar dropdown while an
  // admin is already viewing AdminView would silently fail to switch tabs.
  useEffect(() => {
    setActiveTab(parseDeepLinkTab(initialTab) ?? 'commissions');
  }, [initialTab]);
  const [briefs, setBriefs] = useState(null);
  const [orders, setOrders] = useState(null);
  const [pieces, setPieces] = useState(null);
  const [archiveItems, setArchiveItems] = useState(null);
  const [hero, setHero] = useState(null);
  // Each of the four admin fetches used to treat a failure exactly like a
  // genuinely empty table — "0 briefs, 0 orders, 0 products, 0 archive
  // items" — which for the site owner checking their own store is a real
  // false alarm, not a cosmetic empty state. Tracked separately per tab so
  // a hiccup on one query doesn't misreport the other three as empty too.
  const [briefsFailed, setBriefsFailed] = useState(false);
  const [ordersFailed, setOrdersFailed] = useState(false);
  const [piecesFailed, setPiecesFailed] = useState(false);
  const [archiveFailed, setArchiveFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);
  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    withTimeout(
      supabase
        .from('commission_briefs')
        .select('*')
        .order('created_at', { ascending: false })
    ).then(({ data, error }) => {
      if (cancelled) return;
      setBriefsFailed(Boolean(error));
      setBriefs(error || !data ? [] : data);
    });

    withTimeout(
      supabase
        .from('orders')
        .select('*, product:products(title), patron:profiles(full_name, email)')
        .order('created_at', { ascending: false })
    ).then(({ data, error }) => {
      if (cancelled) return;
      setOrdersFailed(Boolean(error));
      setOrders(error || !data ? [] : data);
    });

    withTimeout(
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
    ).then(({ data, error }) => {
      if (cancelled) return;
      setPiecesFailed(Boolean(error));
      setPieces(error || !data ? [] : data.map(mapProductRow));
    });

    withTimeout(
      supabase
        .from('archive_items')
        .select('*')
        .order('created_at', { ascending: false })
    ).then(({ data, error }) => {
      if (cancelled) return;
      setArchiveFailed(Boolean(error));
      setArchiveItems(error || !data ? [] : data.map(mapArchiveRow));
    });

    withTimeout(
      supabase.from('hero_content').select('image_url, heading, subtext').eq('id', 1).single()
    ).then(({ data, error }) => {
      if (cancelled) return;
      setHeroFailed(Boolean(error));
      setHero(error || !data ? null : data);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // null (rendered as "—" by StatCard), not 0 — these stat cards are
  // visible regardless of which tab is active, so a failed fetch showing
  // "0 New Briefs Awaiting Review" would be the very first false alarm the
  // site owner sees on their own dashboard, before ever reaching a tab.
  const newBriefCount = briefsFailed ? null : briefs?.filter((b) => b.status === 'brief_submitted').length ?? 0;
  const pendingOrderCount = ordersFailed ? null : orders?.filter((o) => o.status !== 'delivered').length ?? 0;
  const soldOutCount = piecesFailed ? null : pieces?.filter((p) => p.soldOut).length ?? 0;

  return (
    <main className="min-h-screen bg-sand text-on-surface font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-accent flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-on-surface">ACUA Admin</h1>
              <p className="text-xs text-on-surface-variant">
                Owner operations dashboard • {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-accent transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
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
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                  isActive ? 'bg-chile-rojo text-white' : 'bg-surface-elevated text-on-surface hover:bg-surface-container shadow-cloud-sm'
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
          ) : briefsFailed ? (
            <AdminTabError label="commission briefs" onRetry={refresh} />
          ) : (
            <CommissionPipeline briefs={briefs} onUpdated={refresh} showToast={showToast} />
          ))}
        {activeTab === 'orders' &&
          (orders === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : ordersFailed ? (
            <AdminTabError label="orders" onRetry={refresh} />
          ) : (
            <OrderFulfillment orders={orders} onUpdated={refresh} showToast={showToast} />
          ))}
        {activeTab === 'inventory' &&
          (pieces === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : piecesFailed ? (
            <AdminTabError label="products" onRetry={refresh} />
          ) : (
            <InventoryCuration pieces={pieces} onUpdated={refresh} showToast={showToast} />
          ))}
        {activeTab === 'archive' &&
          (archiveItems === null ? (
            <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
          ) : archiveFailed ? (
            <AdminTabError label="archive items" onRetry={refresh} />
          ) : (
            <ArchiveCuration archiveItems={archiveItems} onUpdated={refresh} showToast={showToast} />
          ))}
        {activeTab === 'hero' &&
          (hero === null ? (
            heroFailed ? (
              <AdminTabError label="the homepage hero" onRetry={refresh} />
            ) : (
              <p className="text-center text-sm text-on-surface-variant py-16">Loading…</p>
            )
          ) : (
            <HeroCuration hero={hero} onUpdated={refresh} showToast={showToast} />
          ))}
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}
