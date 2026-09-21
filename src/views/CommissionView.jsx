import React, { useState } from 'react';
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

export default function CommissionView({ prefill }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => ({
    fullName: '',
    email: user?.email ?? '',
    phone: '',
    timeline: 'Flexible (4-6 Weeks)',
    category: prefill?.category ?? 'Sculptural Ring',
    material: prefill?.material ?? 'non-tarnish-gold-tone',
    budget: '₱45,000 – ₱84,000',
    narrative: prefill ? `Inspired by "${prefill.title}" from The Archive — ` : '',
  }));

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dragActive, setDragActive] = useState(false);

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
    const validFiles = Array.from(files).map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...validFiles]);
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

    // Generated client-side, before the brief row exists, so reference
    // images can be uploaded under this id first and the brief can be
    // inserted once with reference_image_urls already populated. Briefs
    // can only be updated by an admin (see "Admins can update briefs"),
    // so an anonymous patron has no way to attach paths after the fact.
    const briefId = crypto.randomUUID();
    const uploadedPaths = [];
    for (const [idx, img] of uploadedImages.entries()) {
      const ext = img.name.includes('.') ? img.name.split('.').pop() : 'jpg';
      const path = `${briefId}/${idx}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('commission-references')
        .upload(path, img.file, { contentType: img.file.type });
      if (!uploadError) {
        uploadedPaths.push(path);
      }
    }

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
      setIsSubmitting(false);
      setSubmitError(error.message);
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1d1c16] font-sans antialiased relative selection:bg-chile-rojo selection:text-white">

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
                <div className="w-16 h-16 rounded-full bg-chile-rojo/10 flex items-center justify-center mx-auto text-chile-rojo shadow-cloud-sm">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-chile-rojo">
                    Brief Received
                  </span>
                  <h2 className="font-serif text-3xl text-[#1d1c16] font-normal">
                    Sculpting Your Story
                  </h2>
                  <p className="text-sm text-[#57423b] leading-relaxed">
                    Thank you, <strong className="text-[#1d1c16] font-semibold">{formData.fullName}</strong>. Our head artisan will review your design notes and reach out at <strong className="text-[#1d1c16] font-semibold">{formData.email}</strong> with a concept sketch and a fixed quote within 48 hours — no payment is due to submit a brief.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f8f3ea]/80 shadow-input-inset text-xs text-[#57423b] flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-chile-rojo flex-shrink-0" />
                  <span>Next: concept sketch & quote within 48 hours</span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setUploadedImages([]);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#ece8df]/60 hover:bg-[#ece8df] text-xs font-semibold text-[#1d1c16] transition-colors border-none"
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
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-chile-rojo/10 text-chile-rojo mb-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#1d1c16] font-normal leading-[1.15]">
                    Custom Commissions
                  </h1>
                  <p className="text-xs sm:text-sm text-[#57423b] leading-relaxed font-sans">
                    Collaborate directly with our master artisan. From non-tarnish premium alloys to raw natural stones and pearls, we hand-craft a singular piece sculpted around your story.
                  </p>
                </div>

                {/* Archive reference banner — only when arriving via "Request Similar Piece" */}
                {prefill && (
                  <div className="flex items-center gap-3 max-w-xl mx-auto p-3 rounded-2xl bg-[#f8f3ea]/80 shadow-input-inset">
                    <img
                      src={prefill.image}
                      alt={prefill.alt ?? prefill.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <p className="text-xs text-[#57423b] leading-snug">
                      Inspired by <span className="font-semibold text-[#1d1c16]">{prefill.title}</span> from The Archive.
                      We've pre-filled the category and material below — adjust anything you'd like.
                    </p>
                  </div>
                )}

                {/* --------------------------------------------------- */}
                {/* Section 1: Client Information (Border-free Cloud)   */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#57423b] block">
                    01. Patron Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                        Full Name *
                      </label>
                      <input
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
                      <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                        Email Address *
                      </label>
                      <input
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
                      <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                        Phone or Instagram Handle
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="@genevieve.d or +1 (555) 000-0000"
                        className="cloud-input"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                        Desired Timeline
                      </label>
                      <input
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
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#57423b] block">
                    02. Artifact Anatomy & Materials
                  </span>

                  {/* Category Pill Buttons (Zero borders, soft cloud states) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#1d1c16] block">
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
                            className={`px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all border-none ${
                              isSelected
                                ? 'bg-chile-rojo text-white shadow-terracotta-glow font-semibold'
                                : 'bg-[#f8f3ea]/90 text-[#1d1c16] hover:bg-white shadow-input-inset'
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
                    <label className="text-xs font-medium text-[#1d1c16] block">
                      Material Selection
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {MATERIAL_OPTIONS.map((option) => {
                        const isSelected = formData.material === option.id;
                        return (
                          <div
                            key={option.id}
                            onClick={() => setFormData((prev) => ({ ...prev, material: option.id }))}
                            className={`cursor-pointer p-4 rounded-2xl transition-all border-none ${
                              isSelected
                                ? 'bg-white shadow-cloud text-[#1d1c16] ring-2 ring-chile-rojo'
                                : 'bg-[#f8f3ea]/70 hover:bg-white/80 shadow-input-inset text-[#1d1c16]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{option.label}</span>
                              <div
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-chile-rojo' : 'bg-[#ece8df]'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-[#57423b] block">{option.note}</span>
                          </div>
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
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#57423b] block">
                      03. Investment Scope
                    </span>
                    <span className="text-[11px] text-[#57423b]">Non-binding guideline</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BUDGET_TIERS.map((tier) => {
                      const isSelected = formData.budget === tier.range;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, budget: tier.range }))}
                          className={`p-3.5 sm:p-4 rounded-2xl text-left transition-all border-none ${
                            isSelected
                              ? 'bg-chile-rojo text-white shadow-terracotta-glow font-semibold'
                              : 'bg-[#f8f3ea]/80 hover:bg-white text-[#1d1c16] shadow-input-inset'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-semibold">{tier.range}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/85' : 'text-[#57423b]'}`}>
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
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#57423b] block">
                    04. Narrative & Reference Assets
                  </span>

                  <div>
                    <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                      Concept Vision & Symbolism *
                    </label>
                    <textarea
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
                    <label className="text-xs font-medium text-[#1d1c16] mb-1.5 block">
                      Visual References or Sketches (Optional)
                    </label>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative rounded-3xl p-6 sm:p-8 text-center transition-all border-none ${
                        dragActive
                          ? 'bg-white shadow-cloud ring-2 ring-chile-rojo'
                          : 'bg-[#f8f3ea]/60 hover:bg-white/80 shadow-input-inset'
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload reference files"
                      />

                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white shadow-cloud-sm flex items-center justify-center text-chile-rojo">
                          <UploadCloud className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-[#1d1c16]">
                          <span className="text-chile-rojo font-semibold underline underline-offset-2">Click to select files</span> or drag and drop
                        </div>
                        <p className="text-[10px] text-[#57423b]">
                          JPEG, PNG, HEIC or sketches up to 15MB each
                        </p>
                      </div>
                    </div>

                    {/* Image Previews */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-2xl overflow-hidden bg-white p-2 shadow-cloud-sm flex items-center gap-2"
                          >
                            <img
                              src={img.preview}
                              alt="Upload preview"
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[#1d1c16] truncate">{img.name}</p>
                              <p className="text-[9px] text-[#57423b]">{img.size}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-1 rounded-full text-[#57423b] hover:text-chile-rojo border-none bg-transparent"
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
                  <div className="flex items-start gap-2 text-xs text-chile-rojo bg-chile-rojo/10 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#dec0b7]/30">
                  <div className="flex items-center gap-2 text-xs text-[#57423b]">
                    <ShieldCheck className="w-4 h-4 text-chile-rojo flex-shrink-0" />
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

      {/* FOOTER */}
      <footer className="bg-[#ece8df]/50 border-none py-12 text-center text-xs text-[#57423b]">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif text-base tracking-widest text-[#1d1c16] uppercase">
            A C U A
          </p>
          <p>© {new Date().getFullYear()} ACUA Handmade Accessories. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
