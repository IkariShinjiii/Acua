import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { JEWELRY_CATEGORIES, MATERIAL_OPTIONS, BUDGET_TIERS } from '../data/commissionOptions';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Matches the "JPEG, PNG, HEIC or sketches up to 15MB each" copy on the
// upload box itself — the accept="" attribute only filters the native file
// picker, not drag-and-drop, so this is the only real gate.
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|heic|heif|pdf)$/i;

function isAcceptedFileType(file) {
  // Some browsers/OSes report an empty or generic MIME type for HEIC, so
  // the extension is checked as a fallback rather than trusting file.type alone.
  if (/^image\/|^application\/pdf$/.test(file.type)) return true;
  return ACCEPTED_EXTENSIONS.test(file.name);
}

const VALID_MATERIAL_IDS = new Set(MATERIAL_OPTIONS.map((option) => option.id));

// The commission brief is a long form (contact details, category,
// material, budget, timeline, a multi-sentence narrative) — losing all of
// it to an accidental refresh or back-button press would be a real,
// frustrating loss, the same problem the cart already solves the same way.
const DRAFT_KEY = 'acua-commission-draft';

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CommissionView({ prefill }) {
  const { user } = useAuth();
  // "Request Similar" fires from three places: a sold-out storefront piece
  // (HomeView's grid, ProductDetailView) or an actual past Archive piece
  // (HomeView's Archive section) — only the latter is really "from The
  // Archive," so the copy below can't hardcode that phrase.
  const prefillSourceLabel = prefill?.source === 'archive' ? 'The Archive' : 'Available Pieces';
  // archive_items.material holds a MATERIAL_OPTIONS id, but products.material
  // holds free descriptive text for the storefront card (e.g. "Non-Tarnish
  // Gold-Tone Chain & Freshwater Pearl") — matching neither option id here
  // would otherwise leave every material card silently unselected while the
  // banner claims it was pre-filled. Fall back to the default id and keep
  // the real description in the narrative instead.
  const prefillMaterialId =
    prefill?.material && VALID_MATERIAL_IDS.has(prefill.material) ? prefill.material : undefined;

  const getBlankFormData = () => ({
    fullName: '',
    email: user?.email ?? '',
    phone: '',
    timeline: 'Flexible (4-6 Weeks)',
    category: prefill?.category ?? 'Necklace / Choker',
    material: prefillMaterialId ?? 'non-tarnish-gold-tone',
    budget: '₱45,000 – ₱84,000',
    narrative: prefill
      ? `Inspired by "${prefill.title}" from ${prefillSourceLabel}${
          prefillMaterialId ? '' : ` (similar material: ${prefill.material})`
        } — `
      : '',
  });

  const [formData, setFormData] = useState(() => {
    const blank = getBlankFormData();
    // A fresh "Request Similar" click is a deliberate action just taken —
    // it should always win over a stale saved draft from some earlier,
    // unrelated visit to this form.
    if (prefill) return blank;
    const draft = readDraft();
    return draft ? { ...blank, ...draft } : blank;
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [failedUploadCount, setFailedUploadCount] = useState(0);

  useEffect(() => {
    // Once submitted, the brief is durably saved server-side and the draft
    // has already been cleared (see handleSubmit) — this just needs to not
    // immediately re-write it right back from the reset button's blank
    // formData before that click's own logic gets a chance to matter.
    if (isSubmitted) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // Same as the cart: storage can throw in private-browsing/blocked
      // contexts — the draft just won't survive a reload there.
    }
  }, [formData, isSubmitted]);

  // Each preview is a blob: URL from URL.createObjectURL, which holds its
  // referenced file data in memory until explicitly revoked — the browser
  // never does this on its own. removeFile already revokes one at a time;
  // this ref (kept current every render, cheaper than an effect) lets a
  // single unmount-only cleanup revoke whatever's left if the patron
  // navigates away mid-form with images still attached.
  const uploadedImagesRef = useRef(uploadedImages);
  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const accepted = [];
    const rejected = [];
    for (const file of Array.from(files)) {
      if (!isAcceptedFileType(file)) {
        rejected.push(`${file.name} (unsupported file type)`);
      } else if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} (over 15MB)`);
      } else {
        accepted.push(file);
      }
    }

    setFileError(rejected.length > 0 ? `Not added — ${rejected.join(', ')}.` : '');

    if (accepted.length > 0) {
      const validFiles = accepted.map((file) => ({
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: URL.createObjectURL(file),
      }));
      setUploadedImages((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setUploadedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    // Supabase's query/storage builders normally resolve with { error }
    // rather than throwing even on a network failure, but that's not an
    // absolute guarantee for every edge case — without this, an unexpected
    // throw here would skip every setIsSubmitting(false) below and leave
    // the submit button permanently stuck disabled until a page reload.
    try {
      // Generated client-side, before the brief row exists, so reference
      // images can be uploaded under this id first and the brief can be
      // inserted once with reference_image_urls already populated. Briefs
      // can only be updated by an admin (see "Admins can update briefs"),
      // so an anonymous patron has no way to attach paths after the fact.
      const briefId = crypto.randomUUID();
      const uploadedPaths = [];
      let failedUploads = 0;
      for (const [idx, img] of uploadedImages.entries()) {
        const ext = img.name.includes('.') ? img.name.split('.').pop() : 'jpg';
        const path = `${briefId}/${idx}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('commission-references')
          .upload(path, img.file, { contentType: img.file.type });
        if (uploadError) {
          failedUploads += 1;
        } else {
          uploadedPaths.push(path);
        }
      }
      setFailedUploadCount(failedUploads);

      const { error } = await supabase.from('commission_briefs').insert({
        id: briefId,
        user_id: user?.id ?? null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        category: formData.category,
        material: formData.material,
        budget_range: formData.budget,
        timeline: formData.timeline || null,
        narrative: formData.narrative || null,
        reference_image_urls: uploadedPaths,
      });

      if (error) {
        setSubmitError(error.message);
        return;
      }

      // Successfully uploaded to storage now, so the local blob previews
      // are no longer needed — reclaim their memory instead of waiting for
      // an unmount that might not happen for a while in an SPA session.
      uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
      // The brief is durably saved server-side now — the local draft would
      // otherwise still be sitting there next time this form opens.
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to clean up if storage was inaccessible in the first place.
      }
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand text-on-surface font-sans antialiased relative selection:bg-chile-rojo selection:text-white">

      {/* ------------------------------------------------------------- */}
      {/* MAIN COMMISSION STAGE                                         */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 sm:pb-32">

        {/* Diffused Background Radial Warmth (Zero harsh edges) */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-chile-rojo/20 via-sunset/15 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* ----------------------------------------------------------- */}
        {/* THE "CLOUD" CARD (Border-free, large organic radius, shadow) */}
        {/* ----------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="cloud-card p-6 sm:p-12 lg:p-14 relative overflow-hidden"
        >
          {/* Top Multi-Color Palette Accent Bar (From Mockup) */}
          <div className="palette-strip w-28 mx-auto mb-8" />

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              /* ======================================================= */
              /* SUCCESS STATE FEEDBACK                                  */
              /* ======================================================= */
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="text-center py-12 sm:py-16 space-y-6 max-w-md mx-auto"
              >
                <div className="w-16 h-16 rounded-full bg-chile-rojo/10 flex items-center justify-center mx-auto text-accent shadow-cloud-sm">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent">
                    Brief Received
                  </span>
                  <h2 className="font-serif text-3xl text-on-surface font-normal">
                    Sculpting Your Story
                  </h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Thank you, <strong className="text-on-surface font-semibold">{formData.fullName}</strong>. Our head artisan will review your design notes and reach out at <strong className="text-on-surface font-semibold">{formData.email}</strong> with a concept sketch and a fixed quote within 48 hours — no payment is due to submit a brief.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low/80 shadow-input-inset text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Next: concept sketch & quote within 48 hours</span>
                </div>

                {failedUploadCount > 0 && (
                  <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3 text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Your brief was received, but {failedUploadCount === 1 ? 'one reference image' : `${failedUploadCount} reference images`} failed to upload. Mention it to us at {formData.email} and we'll get it sorted.
                    </span>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setUploadedImages([]);
                      setFileError('');
                      setFailedUploadCount(0);
                      // Otherwise the just-submitted brief's own category,
                      // material, and narrative stay sitting in the form —
                      // "Submit Another Commission" should start fresh, not
                      // resubmit a near-duplicate of the one just sent.
                      setFormData(getBlankFormData());
                    }}
                    className="px-6 py-2.5 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
                  >
                    Submit Another Commission
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ======================================================= */
              /* BORDERLESS COMMISSION FORM                              */
              /* ======================================================= */
              <form onSubmit={handleSubmit} className="space-y-9 relative">

                {/* Form Header */}
                <div className="text-center max-w-xl mx-auto space-y-2.5">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-chile-rojo/10 text-accent mb-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-on-surface font-normal leading-[1.15]">
                    Custom Commissions
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-sans">
                    Collaborate directly with our master artisan. From non-tarnish premium alloys to raw natural stones and pearls, we hand-craft a singular piece sculpted around your story.
                  </p>
                </div>

                {/* Reference banner — only when arriving via "Request Similar" */}
                {prefill && (
                  <div className="flex items-center gap-3 max-w-xl mx-auto p-3 rounded-2xl bg-surface-container-low/80 shadow-input-inset">
                    <img
                      src={prefill.image}
                      alt={prefill.alt ?? prefill.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <p className="text-xs text-on-surface-variant leading-snug">
                      Inspired by <span className="font-semibold text-on-surface">{prefill.title}</span> from {prefillSourceLabel}.
                      We've pre-filled the category and material below — adjust anything you'd like.
                    </p>
                  </div>
                )}

                {/* --------------------------------------------------- */}
                {/* Section 1: Client Information (Border-free Cloud)   */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant block">
                    01. Patron Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="commission-full-name" className="text-xs font-medium text-on-surface mb-1.5 block">
                        Full Name *
                      </label>
                      <input
                        id="commission-full-name"
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Genevieve Dupont"
                        className="cloud-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="commission-email" className="text-xs font-medium text-on-surface mb-1.5 block">
                        Email Address *
                      </label>
                      <input
                        id="commission-email"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="genevieve@example.com"
                        className="cloud-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="commission-phone" className="text-xs font-medium text-on-surface mb-1.5 block">
                        Phone or Instagram Handle
                      </label>
                      <input
                        id="commission-phone"
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="@genevieve.d or +1 (555) 000-0000"
                        className="cloud-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="commission-timeline" className="text-xs font-medium text-on-surface mb-1.5 block">
                        Desired Timeline
                      </label>
                      <input
                        id="commission-timeline"
                        type="text"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleInputChange}
                        placeholder="e.g. Wedding Date / 4 Weeks"
                        className="cloud-input"
                      />
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* Section 2: Piece Category & Material Preference    */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4 pt-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant block">
                    02. Artifact Anatomy & Materials
                  </span>

                  {/* Category Pill Buttons (Zero borders, soft cloud states) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-on-surface block">
                      Accessory Category
                    </label>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {JEWELRY_CATEGORIES.map((cat) => {
                        const isSelected = formData.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                            className={`px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                              isSelected
                                ? 'bg-chile-rojo text-white shadow-terracotta-glow font-semibold'
                                : 'bg-surface-container-low/90 text-on-surface hover:bg-surface-elevated shadow-input-inset'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Material Options (Border-free tactile cloud cards) */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-on-surface block">
                      Material Selection
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Material Selection">
                      {MATERIAL_OPTIONS.map((option) => {
                        const isSelected = formData.material === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setFormData((prev) => ({ ...prev, material: option.id }))}
                            className={`cursor-pointer p-4 rounded-2xl transition-all border-none text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                              isSelected
                                ? 'bg-surface-elevated shadow-cloud text-on-surface ring-2 ring-chile-rojo'
                                : 'bg-surface-container-low/70 hover:bg-surface-elevated/80 shadow-input-inset text-on-surface'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{option.label}</span>
                              <div
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-chile-rojo' : 'bg-surface-container-high'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-surface-elevated" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-on-surface-variant block">{option.note}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* Section 3: Target Investment (Budget Tiers)         */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant block">
                      03. Investment Scope
                    </span>
                    <span className="text-[11px] text-on-surface-variant">Non-binding guideline</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BUDGET_TIERS.map((tier) => {
                      const isSelected = formData.budget === tier.range;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, budget: tier.range }))}
                          className={`p-3.5 sm:p-4 rounded-2xl text-left transition-all border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
                            isSelected
                              ? 'bg-chile-rojo text-white shadow-terracotta-glow font-semibold'
                              : 'bg-surface-container-low/80 hover:bg-surface-elevated text-on-surface shadow-input-inset'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-semibold">{tier.range}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/85' : 'text-on-surface-variant'}`}>
                            {tier.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* Section 4: Inspiration Narrative & Image Upload     */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4 pt-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-on-surface-variant block">
                    04. Narrative & Reference Assets
                  </span>

                  <div>
                    <label htmlFor="commission-narrative" className="text-xs font-medium text-on-surface mb-1.5 block">
                      Concept Vision & Symbolism *
                    </label>
                    <textarea
                      id="commission-narrative"
                      name="narrative"
                      rows={4}
                      required
                      value={formData.narrative}
                      onChange={handleInputChange}
                      placeholder="Describe the desired contours, raw stone choices (Keshi pearl, natural carnelian, sea sapphire), bead textures, or the personal milestone behind this piece..."
                      className="cloud-input resize-none"
                    />
                  </div>

                  {/* Border-Free Cloud Upload Box */}
                  <div>
                    <label htmlFor="commission-file-upload" className="text-xs font-medium text-on-surface mb-1.5 block">
                      Visual References or Sketches (Optional)
                    </label>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative rounded-3xl p-6 sm:p-8 text-center transition-all border-none ${
                        dragActive
                          ? 'bg-surface-elevated shadow-cloud ring-2 ring-chile-rojo'
                          : 'bg-surface-container-low/60 hover:bg-surface-elevated/80 shadow-input-inset'
                      }`}
                    >
                      <input
                        id="commission-file-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload reference files"
                      />

                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-surface-elevated shadow-cloud-sm flex items-center justify-center text-accent">
                          <UploadCloud className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-on-surface">
                          <span className="text-accent font-semibold underline underline-offset-2">Click to select files</span> or drag and drop
                        </div>
                        <p className="text-[10px] text-on-surface-variant">
                          JPEG, PNG, HEIC or sketches up to 15MB each
                        </p>
                      </div>
                    </div>

                    {fileError && (
                      <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3 mt-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{fileError}</span>
                      </div>
                    )}

                    {/* Image Previews */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-2xl overflow-hidden bg-surface-elevated p-2 shadow-cloud-sm flex items-center gap-2"
                          >
                            <img
                              src={img.preview}
                              alt="Upload preview"
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-on-surface truncate">{img.name}</p>
                              <p className="text-[9px] text-on-surface-variant">{img.size}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              aria-label={`Remove ${img.name}`}
                              className="p-2.5 -m-1 rounded-full text-on-surface-variant hover:text-accent border-none bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* SUBMISSION FOOTER (Deep Terracotta Button)           */}
                {/* --------------------------------------------------- */}
                {submitError && (
                  <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>Complimentary consultation • Zero financial obligation</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-terracotta w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Transmitting Brief...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Submit Custom Brief</span>
                        <ArrowRight className="w-4 h-4 stroke-[2]" />
                      </div>
                    )}
                  </button>
                </div>

              </form>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}
