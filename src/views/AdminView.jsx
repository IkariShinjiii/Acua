import React, { useState } from 'react';
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
import { COMMISSION_BRIEFS, COMMISSION_STAGES } from '../data/commissionBriefs';
import { ORDERS, ORDER_STAGES } from '../data/orders';
import { AVAILABLE_PIECES, FILTER_TABS } from '../data/products';

const TABS = [
  { id: 'commissions', label: 'Commission Pipeline', icon: Hammer },
  { id: 'orders', label: 'Order Fulfillment', icon: Package },
  { id: 'inventory', label: 'Inventory & Site Curation', icon: Gem },
];

function stageIndex(stages, id) {
  return stages.findIndex((s) => s.id === id);
}

function StatusBadge({ label, tone = 'neutral' }) {
  const toneClass =
    tone === 'done'
      ? 'bg-olive/15 text-olive'
      : tone === 'active'
      ? 'bg-chile-rojo/10 text-chile-rojo'
      : 'bg-[#ece8df] text-[#57423b]';
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
        <p className="text-2xl font-serif text-[#1d1c16] leading-none">{value}</p>
        <p className="text-xs text-[#57423b] mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Commission Pipeline                                                  */
/* ------------------------------------------------------------------ */
function CommissionPipeline({ briefs, setBriefs }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [quoteDrafts, setQuoteDrafts] = useState({});

  const advance = (id, nextStatus, extra = {}) => {
    setBriefs((prev) => prev.map((b) => (b.id === id ? { ...b, status: nextStatus, ...extra } : b)));
  };

  const visible =
    statusFilter === 'all' ? briefs : briefs.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
            statusFilter === 'all' ? 'bg-[#1d1c16] text-white' : 'bg-[#f2ede4] text-[#1d1c16] hover:bg-[#ece8df]'
          }`}
        >
          All
        </button>
        {COMMISSION_STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
              statusFilter === s.id ? 'bg-[#1d1c16] text-white' : 'bg-[#f2ede4] text-[#1d1c16] hover:bg-[#ece8df]'
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
          return (
            <div key={brief.id} className="bg-white rounded-2xl shadow-cloud-sm p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg text-[#1d1c16]">{brief.patronName}</h3>
                    <StatusBadge
                      label={COMMISSION_STAGES[idx].label}
                      tone={isDelivered ? 'done' : 'active'}
                    />
                  </div>
                  <p className="text-xs text-[#57423b] mt-1">
                    {brief.email} • {brief.category} • {brief.metal}
                  </p>
                  <p className="text-sm text-[#1d1c16]/80 mt-3 leading-relaxed max-w-2xl">
                    {brief.narrative}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-[#57423b]">
                    <span>Budget: {brief.budget}</span>
                    <span>Timeline: {brief.timeline}</span>
                    <span>{brief.referenceImageCount} reference image(s)</span>
                    <span>Submitted {brief.submittedAt}</span>
                    {brief.quotePrice && <span>Quote: {brief.quotePrice}</span>}
                  </div>
                </div>

                {/* Pipeline action, one step ahead of the current status */}
                <div className="flex-shrink-0 w-full sm:w-56">
                  {brief.status === 'brief-submitted' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Quote price (e.g. $950)"
                        value={quoteDrafts[brief.id] ?? ''}
                        onChange={(e) =>
                          setQuoteDrafts((prev) => ({ ...prev, [brief.id]: e.target.value }))
                        }
                        className="w-full rounded-full bg-[#f8f3ea] px-4 py-2 text-xs text-[#1d1c16] border-none outline-none focus:bg-white shadow-input-inset"
                      />
                      <button
                        onClick={() =>
                          advance(brief.id, 'quote-sent', { quotePrice: quoteDrafts[brief.id] || 'TBD' })
                        }
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-chile-rojo text-white flex items-center justify-center border-none cursor-pointer hover:brightness-90"
                        aria-label="Send quote"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {brief.status === 'quote-sent' && (
                    <button
                      onClick={() => advance(brief.id, 'in-production')}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all"
                    >
                      Deposit Received → Production
                    </button>
                  )}
                  {brief.status === 'in-production' && (
                    <button
                      onClick={() => advance(brief.id, 'delivered')}
                      className="w-full px-4 py-2.5 rounded-full bg-chile-rojo text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:brightness-90 transition-all"
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
          <p className="text-center text-sm text-[#57423b] py-12">No briefs in this stage.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order Fulfillment                                                     */
/* ------------------------------------------------------------------ */
function OrderFulfillment({ orders, setOrders }) {
  const advance = (id) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = stageIndex(ORDER_STAGES, o.status);
        const next = ORDER_STAGES[idx + 1];
        if (!next) return o;
        const trackingNumber =
          next.id === 'shipped' && !o.trackingNumber
            ? `PHLPOST-${Math.floor(10000000 + Math.random() * 89999999)}`
            : o.trackingNumber;
        return { ...o, status: next.id, trackingNumber };
      })
    );
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
                <h3 className="font-serif text-lg text-[#1d1c16]">#{order.id}</h3>
                <StatusBadge label={ORDER_STAGES[idx].label} tone={idx === ORDER_STAGES.length - 1 ? 'done' : 'active'} />
              </div>
              <p className="text-xs text-[#57423b] mt-1">
                {order.customerName} • {order.items.join(', ')}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[#57423b]">
                <span>Total: {order.total}</span>
                <span>Placed {order.placedAt}</span>
                {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
              </div>
            </div>
            {next ? (
              <button
                onClick={() => advance(order.id)}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory & Site Curation                                            */
/* ------------------------------------------------------------------ */
function InventoryCuration({ pieces, setPieces }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState({ title: '', category: FILTER_TABS[1], material: '', price: '', image: '' });

  const toggleSoldOut = (id) => {
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, soldOut: !p.soldOut } : p)));
  };

  const addPiece = (e) => {
    e.preventDefault();
    if (!draft.title || !draft.price) return;
    setPieces((prev) => [
      {
        id: `ap-${Date.now()}`,
        title: draft.title,
        category: draft.category,
        material: draft.material || 'Details TBD',
        description: 'New addition — details to be finalized.',
        price: draft.price,
        image: draft.image || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80',
        soldOut: false,
      },
      ...prev,
    ]);
    setDraft({ title: '', category: FILTER_TABS[1], material: '', price: '', image: '' });
    setShowAddForm(false);
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
              className="rounded-xl bg-[#f8f3ea] px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="rounded-xl bg-[#f8f3ea] px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
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
              className="rounded-xl bg-[#f8f3ea] px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <input
              required
              placeholder="Price (e.g. $220) *"
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              className="rounded-xl bg-[#f8f3ea] px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset"
            />
            <input
              placeholder="Image URL (optional)"
              value={draft.image}
              onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
              className="rounded-xl bg-[#f8f3ea] px-4 py-2.5 text-sm border-none outline-none focus:bg-white shadow-input-inset sm:col-span-2"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-5 py-2.5 rounded-full bg-[#1d1c16] text-white text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:opacity-90 transition-all"
            >
              Save Piece
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pieces.map((piece) => (
          <div key={piece.id} className="bg-white rounded-2xl shadow-cloud-sm overflow-hidden">
            <div className="relative aspect-square bg-[#f8f3ea]">
              <img src={piece.image} alt={piece.title} className="w-full h-full object-cover" />
              {piece.soldOut && (
                <div className="absolute inset-0 bg-[#1d1c16]/60 flex items-center justify-center">
                  <span className="bg-white text-[#1d1c16] text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <p className="font-sans text-sm font-medium text-[#1d1c16]">{piece.title}</p>
              <p className="text-xs text-[#57423b]">{piece.category} • {piece.price}</p>
              <button
                onClick={() => toggleSoldOut(piece.id)}
                className={`w-full mt-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer transition-colors ${
                  piece.soldOut
                    ? 'bg-[#f2ede4] text-[#1d1c16] hover:bg-[#ece8df]'
                    : 'bg-[#1d1c16] text-white hover:opacity-90'
                }`}
              >
                {piece.soldOut ? 'Mark Available' : 'Mark Sold Out'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                  */
/* ------------------------------------------------------------------ */
export default function AdminView() {
  const [activeTab, setActiveTab] = useState('commissions');

  // Lifted up (rather than local to each tab) so the stat cards above stay
  // in sync with edits made in any tab — no shared store exists yet, so this
  // is the lightest way to keep the two in agreement.
  const [briefs, setBriefs] = useState(COMMISSION_BRIEFS);
  const [orders, setOrders] = useState(ORDERS);
  const [pieces, setPieces] = useState(AVAILABLE_PIECES);

  const newBriefCount = briefs.filter((b) => b.status === 'brief-submitted').length;
  const pendingOrderCount = orders.filter((o) => o.status !== 'delivered').length;
  const soldOutCount = pieces.filter((p) => p.soldOut).length;

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1d1c16] font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24">
        {/* No real auth yet — see plan.md §4E "Secure Admin Login (RBAC)".
            This view is reachable only via the dev quick-switcher for now. */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-chile-rojo/10 text-chile-rojo flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#1d1c16]">ACUA Admin</h1>
            <p className="text-xs text-[#57423b]">Owner operations dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={Hammer} label="New Briefs Awaiting Review" value={newBriefCount} />
          <StatCard icon={Package} label="Orders In Progress" value={pendingOrderCount} />
          <StatCard icon={Gem} label="Pieces Marked Sold Out" value={soldOutCount} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-[#dec0b7]/30 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border-none cursor-pointer ${
                  isActive ? 'bg-chile-rojo text-white' : 'bg-white text-[#1d1c16] hover:bg-[#f2ede4] shadow-cloud-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {activeTab === 'commissions' && <CommissionPipeline briefs={briefs} setBriefs={setBriefs} />}
        {activeTab === 'orders' && <OrderFulfillment orders={orders} setOrders={setOrders} />}
        {activeTab === 'inventory' && <InventoryCuration pieces={pieces} setPieces={setPieces} />}
      </div>
    </div>
  );
}
