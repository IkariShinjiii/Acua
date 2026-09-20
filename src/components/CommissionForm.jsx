import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Shield, 
  X,
  Send
} from 'lucide-react';

/**
 * Budget Bracket Presets
 */
const BUDGET_OPTIONS = [
  { id: 'b1', label: '$350 - $600', note: 'Single Stone / Minimal Band' },
  { id: 'b2', label: '$600 - $1,200', note: 'Custom Molten Casting' },
  { id: 'b3', label: '$1,200 - $2,500', note: 'Baroque Pearl / Rare Gem' },
  { id: 'b4', label: '$2,500+', note: 'Full Bespoke Heirloom Suite' },
];

/**
 * Jewelry Category Presets
 */
const JEWELRY_TYPES = [
  'Sculptural Ring',
  'Necklace / Choker',
  'Earrings / Molten Drops',
  'Cuff / Bracelet',
  'Ceremonial / Wedding',
];

/**
 * Single-Page Commission Form Component
 * A zero-dead-end custom order flow utilizing Shadcn-style warm input cards,
 * interactive budget pills, drag-and-drop reference uploads, and clear feedback.
 */
export default function CommissionForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    pieceType: 'Sculptural Ring',
    metalPreference: '18k-yellow-gold',
    budgetRange: '$600 - $1,200',
    conceptStory: '',
    targetDate: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Drag and drop handlers for reference file uploads
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
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate brief submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-xs font-semibold text-terracotta-700 tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Custom Commissions</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-espresso-900 font-normal tracking-tight">
          Bring your bespoke vision to life.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-espresso-700 leading-relaxed font-sans">
          Collaborate directly with our master jeweler. From recycled heirloom gold to raw ocean pearls, we craft a singular artifact sculpted around your story.
        </p>
      </div>

      {/* Main Commission Card Container */}
      <div className="bg-sand-50 rounded-3xl sm:rounded-4xl p-6 sm:p-10 lg:p-12 border border-sand-200/90 shadow-warm-clay relative overflow-hidden">
        
        {/* Soft terracotta background glow accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-terracotta-100/50 blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            /* Success State Feedback Card */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 px-4 space-y-6 max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-espresso-900">
                Brief Received with Care
              </h3>
              <p className="text-sm text-espresso-700 leading-relaxed">
                Thank you, <span className="font-semibold text-espresso-900">{formData.fullName}</span>. Our lead jeweler will review your reference concepts and respond with an initial sketch consultation within 48 hours at <span className="font-semibold text-espresso-900">{formData.email}</span>.
              </p>
              <div className="p-4 rounded-2xl bg-sand-100 border border-sand-200 text-xs text-espresso-600 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-terracotta-600" />
                <span>Estimated Timeline: 3-4 Weeks Upon Sketch Approval</span>
              </div>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setUploadedFiles([]);
                  setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    pieceType: 'Sculptural Ring',
                    metalPreference: '18k-yellow-gold',
                    budgetRange: '$600 - $1,200',
                    conceptStory: '',
                    targetDate: '',
                  });
                }}
                className="mt-4 px-6 py-2.5 rounded-full border border-sand-300 text-xs font-semibold text-espresso-800 hover:bg-sand-100 transition-colors"
              >
                Submit Another Inquiry
              </button>
            </motion.div>
          ) : (
            /* Active Multi-Field Commission Form */
            <form onSubmit={handleSubmit} className="space-y-10 relative">
              
              {/* Section 1: Client Information */}
              <div className="space-y-4">
                <h4 className="font-serif text-xl text-espresso-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-sans font-bold flex items-center justify-center">
                    1
                  </span>
                  Your Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Genevieve Dupont"
                      className="w-full px-4 py-3 rounded-2xl bg-sand-100/70 border border-sand-200 text-sm text-espresso-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:bg-sand-50 transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="genevieve@example.com"
                      className="w-full px-4 py-3 rounded-2xl bg-sand-100/70 border border-sand-200 text-sm text-espresso-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:bg-sand-50 transition-all"
                    />
                  </div>

                  {/* Phone / Instagram Handle */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700">
                      Phone or Instagram
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="@handle or +1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-2xl bg-sand-100/70 border border-sand-200 text-sm text-espresso-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:bg-sand-50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Piece Type & Metal Selection */}
              <div className="space-y-5 pt-4 border-t border-sand-200/80">
                <h4 className="font-serif text-xl text-espresso-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-sans font-bold flex items-center justify-center">
                    2
                  </span>
                  Artifact Form & Precious Metals
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700 block">
                    Piece Type
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {JEWELRY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, pieceType: type }))}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-medium tracking-wide transition-all ${
                          formData.pieceType === type
                            ? 'bg-terracotta-600 text-white shadow-soft-sand'
                            : 'bg-sand-100/80 hover:bg-sand-200 text-espresso-800 border border-sand-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metal Radio Options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700 block">
                    Metal Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: '18k-yellow-gold', label: '18k Fairmined Yellow Gold', desc: 'Rich golden luster' },
                      { id: '14k-rose-gold', label: '14k Warm Rose Gold', desc: 'Subtle blush tone' },
                      { id: '925-silver', label: 'Recycled 925 Sterling Silver', desc: 'High-contrast cool patina' },
                    ].map((metal) => (
                      <label
                        key={metal.id}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          formData.metalPreference === metal.id
                            ? 'border-terracotta-500 bg-terracotta-50/70 shadow-xs'
                            : 'border-sand-200 bg-sand-100/50 hover:bg-sand-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-espresso-900">{metal.label}</span>
                          <input
                            type="radio"
                            name="metalPreference"
                            value={metal.id}
                            checked={formData.metalPreference === metal.id}
                            onChange={handleInputChange}
                            className="text-terracotta-600 focus:ring-terracotta-500"
                          />
                        </div>
                        <span className="text-[11px] text-espresso-600">{metal.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Budget Range Selector */}
              <div className="space-y-4 pt-4 border-t border-sand-200/80">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-serif text-xl text-espresso-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-sans font-bold flex items-center justify-center">
                      3
                    </span>
                    Target Investment Range
                  </h4>
                  <span className="text-xs text-espresso-600">Zero-obligation quote</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, budgetRange: opt.label }))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        formData.budgetRange === opt.label
                          ? 'border-terracotta-500 bg-terracotta-gradient text-white shadow-warm-clay'
                          : 'border-sand-200 bg-sand-100/70 hover:bg-sand-200 text-espresso-800'
                      }`}
                    >
                      <div className="font-sans font-semibold text-sm">{opt.label}</div>
                      <div className={`text-[11px] mt-1 ${formData.budgetRange === opt.label ? 'text-white/80' : 'text-espresso-600'}`}>
                        {opt.note}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Design Concept & Reference File Upload */}
              <div className="space-y-5 pt-4 border-t border-sand-200/80">
                <h4 className="font-serif text-xl text-espresso-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-sans font-bold flex items-center justify-center">
                    4
                  </span>
                  Concept Narrative & Visual References
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700">
                    Describe your inspiration or symbolism *
                  </label>
                  <textarea
                    name="conceptStory"
                    rows={4}
                    required
                    value={formData.conceptStory}
                    onChange={handleInputChange}
                    placeholder="Tell us about the desired textures (molten, hammered, organic), stone preferences (raw Keshi pearl, carnelian, sea sapphire), or the meaningful occasion..."
                    className="w-full px-4 py-3 rounded-2xl bg-sand-100/70 border border-sand-200 text-sm text-espresso-900 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:bg-sand-50 transition-all resize-none"
                  />
                </div>

                {/* Drag and Drop File Upload Area */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-espresso-700 block">
                    Upload Reference Images or Sketches (Optional)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                      dragActive
                        ? 'border-terracotta-500 bg-terracotta-50'
                        : 'border-sand-300 hover:border-terracotta-400 bg-sand-100/40'
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
                      <div className="w-12 h-12 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 stroke-[1.75]" />
                      </div>
                      <div className="text-sm font-medium text-espresso-800">
                        <span className="text-terracotta-600 underline underline-offset-2">Click to browse</span> or drag and drop reference images
                      </div>
                      <p className="text-[11px] text-espresso-600">
                        PNG, JPG, HEIC or PDF up to 15MB each
                      </p>
                    </div>
                  </div>

                  {/* Uploaded File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden bg-sand-100 border border-sand-200 p-2 flex items-center gap-2">
                          <img src={file.preview} alt="Upload preview" className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-espresso-900 truncate">{file.name}</p>
                            <p className="text-[10px] text-espresso-600">{file.size}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-full text-espresso-600 hover:text-terracotta-600 hover:bg-sand-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button & Trust Reassurance */}
              <div className="pt-6 border-t border-sand-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2.5 text-xs text-espresso-600">
                  <Shield className="w-4 h-4 text-terracotta-600" />
                  <span>Complimentary 48-hour consultation • No deposit required for brief</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-terracotta-gradient text-white text-sm font-semibold tracking-wide shadow-warm-clay hover:opacity-95 hover:shadow-card-hover transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Brief...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Custom Commission Brief</span>
                      <Send className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
