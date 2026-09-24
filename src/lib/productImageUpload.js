import { supabase } from './supabaseClient';

const BUCKET = 'product-images';
const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.85;

// Phone photos are often 4-12MB and 4000px+ wide, far more than a product
// card or page ever displays. Downscaling to 1600px on the longest edge and
// re-encoding as JPEG in the browser before upload keeps every storefront
// image small (usually a few hundred KB) no matter what's picked, and also
// normalizes PNG/WebP/HEIC into one format every browser can show.
export async function toResizedJpeg(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // e.g. a HEIC photo on a browser that can't decode it (most non-Safari).
    throw new Error("Couldn't read that photo. Try saving it as a JPG or PNG first.");
  }
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error("Couldn't process that photo. Try a different one.");
  return blob;
}

// Returns the uploaded photo's public URL, to store as a product's or
// archive item's image_url. Only an admin session can upload (see
// 0016_product_images_storage.sql).
export async function uploadProductImage(file) {
  const blob = await toResizedJpeg(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) {
    // The product-images bucket comes from 0016_product_images_storage.sql;
    // until that's been run on the project, say so instead of "Bucket not found".
    if (/bucket not found/i.test(error.message)) {
      throw new Error("Photo uploads aren't set up yet. Paste an image link below for now.");
    }
    throw new Error(error.message);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
