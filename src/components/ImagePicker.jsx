import React, { useRef, useState } from 'react';
import { ImagePlus, Link2 } from 'lucide-react';
import { uploadProductImage } from '../lib/productImageUpload';

// Admin photo field: upload from the device (resized + stored in Supabase,
// see lib/productImageUpload) or paste a link to an image hosted elsewhere.
// The upload happens as soon as a file is picked, so the surrounding form
// only ever deals with a finished URL.
export default function ImagePicker({ value, onChange, onUploadingChange, required = false }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showLink, setShowLink] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    onUploadingChange?.(true);
    try {
      onChange(await uploadProductImage(file));
    } catch (err) {
      setError(err?.message || 'Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 items-start">
      <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center">
        {value ? (
          <img src={value} alt="Selected photo preview" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-7 h-7 text-on-surface-variant/50" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 w-full space-y-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider border-none cursor-pointer hover:bg-surface-container-high transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          {uploading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-on-surface/20 border-t-on-surface animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" /> {value ? 'Replace Photo' : `Upload Photo${required ? ' *' : ''}`}
            </>
          )}
        </button>
        {error && <p className="text-xs text-accent">{error}</p>}
        {showLink ? (
          <input
            type="url"
            placeholder="https://… (link to an image)"
            aria-label="Image link"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl bg-surface-container-low px-4 py-2.5 text-sm border-none outline-none focus:bg-surface-elevated shadow-input-inset"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowLink(true)}
            className="flex items-center gap-1.5 py-2 -my-2 text-xs text-on-surface-variant hover:text-accent transition-colors bg-transparent border-none cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-chile-rojo"
          >
            <Link2 className="w-3.5 h-3.5" /> or paste an image link instead
          </button>
        )}
      </div>
    </div>
  );
}
