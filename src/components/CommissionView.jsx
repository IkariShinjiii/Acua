import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  X, 
  ArrowRight
} from 'lucide-react';

/**
 * Palette Presets for Commission Customization
 */
const JEWELRY_CATEGORIES = [
  'Sculptural Ring',
  'Necklace / Choker',
  'Molten Cuff',
  'Artisanal Earrings',
  'Ceremonial / Suite',
];

const METAL_OPTIONS = [
  { id: '18k-gold', label: '18k Fairmined Gold', note: 'Rich molten luster' },
  { id: '14k-rose', label: '14k Warm Rose Gold', note: 'Subtle blush tone' },
  { id: '925-silver', label: '925 Recycled Silver', note: 'Cool chiseled finish' },
];

const BUDGET_TIERS = [
  { id: 'tier-1', range: '$400 – $800', label: 'Single Stone / Band' },
  { id: 'tier-2', range: '$800 – $1,500', label: 'Molten Casting' },
  { id: 'tier-3', range: '$1,500 – $3,000', label: 'Raw Pearl / Gem' },
  { id: 'tier-4', range: '$3,000+', label: 'Heirloom Suite' },
];

/**
 * CommissionView (Layout 3)
 * Strictly adheres to the border-free "Cloud" UI, deep terracotta palette,
 * and warm cream/sand canvas (#F6F1EB) shown in the Figma/Dribbble specification.
 */
export default function CommissionView() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    timeline: 'Flexible (4-6 Weeks)',
    category: 'Sculptural Ring',
    metal: '18k-gold',
    budget: '$800 – $1,500',
    narrative: '',
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate brief submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-sand-100 text-espresso font-sans antialiased relative selection:bg-terracotta-100 selection:text-terracotta-700">
      
      {/* ------------------------------------------------------------- */}
      {/* MAIN COMMISSION STAGE                                         */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-32">
        
        {/* Diffused Background Radial Warmth (Zero harsh edges) */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-terracotta-100/35 via-ochre-light/15 to-transparent blur-3xl pointer-events-none -z-10" />

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
                <div className="w-16 h-16 rounded-full bg-terracotta-50 flex items-center justify-center mx-auto text-terracotta-500 shadow-cloud-sm">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-terracotta-500">
                    Brief Received
                  </span>
                  <h2 className="font-serif text-3xl text-espresso font-normal">
                    Sculpting Your Story
                  </h2>
                  <p className="text-sm text-espresso-muted leading-relaxed">
                    Thank you, <strong className="text-espresso font-semibold">{formData.fullName}</strong>. Our head artisan will review your design notes and reach out at <strong className="text-espresso font-semibold">{formData.email}</strong> with an initial concept sketch within 48 hours.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-sand-50/80 shadow-input-inset text-xs text-espresso-muted flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-terracotta-500 flex-shrink-0" />
                  <span>Estimated Production: 3 – 5 Weeks</span>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setUploadedImages([]);
                    }}
                    className="px-6 py-2.5 rounded-full bg-sand-200/60 hover:bg-sand-200 text-xs font-semibold text-espresso transition-colors border-none"
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
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-terracotta-50 text-terracotta-500 mb-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-espresso font-normal leading-[1.15]">
                    Custom Commissions
                  </h1>
                  <p className="text-xs sm:text-sm text-espresso-muted leading-relaxed font-sans">
                    Collaborate directly with our master jeweler. From molten recycled gold to raw ocean pearls, we craft a singular artifact sculpted around your story.
                  </p>
                </div>

                {/* --------------------------------------------------- */}
                {/* Section 1: Client Information (Border-free Cloud)   */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-espresso-muted block">
                    01. Patron Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-espresso mb-1.5 block">
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
                      <label className="text-xs font-medium text-espresso mb-1.5 block">
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
                      <label className="text-xs font-medium text-espresso mb-1.5 block">
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
                      <label className="text-xs font-medium text-espresso mb-1.5 block">
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
                {/* Section 2: Piece Category & Metal Preference       */}
                {/* --------------------------------------------------- */}
                <div className="space-y-4 pt-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-espresso-muted block">
                    02. Artifact Anatomy & Metals
                  </span>

                  {/* Category Pill Buttons (Zero borders, soft cloud states) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-espresso block">
                      Jewelry Category
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
                                ? 'bg-terracotta-500 text-white shadow-terracotta-glow font-semibold'
                                : 'bg-sand-50/90 text-espresso hover:bg-white shadow-input-inset'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metal Options (Border-free tactile cloud cards) */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-espresso block">
                      Precious Metal Selection
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {METAL_OPTIONS.map((metal) => {
                        const isSelected = formData.metal === metal.id;
                        return (
                          <div
                            key={metal.id}
                            onClick={() => setFormData((prev) => ({ ...prev, metal: metal.id }))}
                            className={`cursor-pointer p-4 rounded-2xl transition-all border-none ${
                              isSelected
                                ? 'bg-white shadow-cloud text-espresso ring-2 ring-terracotta-500'
                                : 'bg-sand-50/70 hover:bg-white/80 shadow-input-inset text-espresso'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{metal.label}</span>
                              <div
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-terracotta-500' : 'bg-sand-200'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className="text-[11px] text-espresso-muted block">{metal.note}</span>
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
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-espresso-muted block">
                      03. Investment Scope
                    </span>
                    <span className="text-[11px] text-espresso-muted">Non-binding guideline</span>
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
                              ? 'bg-terracotta-gradient text-white shadow-terracotta-glow font-semibold'
                              : 'bg-sand-50/80 hover:bg-white text-espresso shadow-input-inset'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-semibold">{tier.range}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/85' : 'text-espresso-muted'}`}>
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
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-espresso-muted block">
                    04. Narrative & Reference Assets
                  </span>

                  <div>
                    <label className="text-xs font-medium text-espresso mb-1.5 block">
                      Concept Vision & Symbolism *
                    </label>
                    <textarea
                      name="narrative"
                      rows={4}
                      required
                      value={formData.narrative}
                      onChange={handleInputChange}
                      placeholder="Describe the desired contours, raw stone choices (Keshi pearl, natural carnelian, sea sapphire), molten textures, or the personal milestone behind this piece..."
                      className="cloud-input resize-none"
                    />
                  </div>

                  {/* Border-Free Cloud Upload Box */}
                  <div>
                    <label className="text-xs font-medium text-espresso mb-1.5 block">
                      Visual References or Sketches (Optional)
                    </label>

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative rounded-3xl p-6 sm:p-8 text-center transition-all border-none ${
                        dragActive
                          ? 'bg-white shadow-cloud ring-2 ring-terracotta-500'
                          : 'bg-sand-50/60 hover:bg-white/80 shadow-input-inset'
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
                        <div className="w-10 h-10 rounded-full bg-white shadow-cloud-sm flex items-center justify-center text-terracotta-500">
                          <UploadCloud className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-espresso">
                          <span className="text-terracotta-500 font-semibold underline underline-offset-2">Click to select files</span> or drag and drop
                        </div>
                        <p className="text-[10px] text-espresso-muted">
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
                              <p className="text-[11px] font-medium text-espresso truncate">{img.name}</p>
                              <p className="text-[9px] text-espresso-muted">{img.size}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-1 rounded-full text-espresso-muted hover:text-terracotta-500 border-none bg-transparent"
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
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-sand-200/50">
                  <div className="flex items-center gap-2 text-xs text-espresso-muted">
                    <ShieldCheck className="w-4 h-4 text-terracotta-500 flex-shrink-0" />
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
      <footer className="bg-sand-200/50 border-none py-12 text-center text-xs text-espresso-muted">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif text-base tracking-widest text-espresso uppercase">
            A C U A
          </p>
          <p>© {new Date().getFullYear()} ACUA Artisanal Jewelry. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
