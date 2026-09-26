import { formatPeso } from './currency';

// Supabase's products/archive_items rows use snake_case + price_cents;
// every view was already built against the mock data's shape (camelCase,
// a formatted price string). Map at the boundary so the fetch is the only
// thing that changes — HomeView/ProductDetailView/CartContext/AdminView
// keep working unmodified against the shape they already expect.
export function mapProductRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    material: row.material,
    description: row.description,
    price: formatPeso(row.price_cents / 100),
    // Kept alongside the formatted string above rather than re-parsing it
    // back out later -- needed as a plain number for Product JSON-LD's
    // offers.price (see ProductDetailView), which per schema.org must be a
    // bare numeric string, not "₱22,000".
    priceCents: row.price_cents,
    soldOut: row.sold_out,
    isOneOfOne: row.is_one_of_one,
    image: row.image_url,
    fallback: row.fallback_image_url,
  };
}

export function mapArchiveRow(row, index) {
  const isEven = index % 2 === 0;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    material: row.material,
    image: row.image_url,
    alt: row.alt_text,
    aspect: isEven ? 'aspect-square' : 'aspect-[3/4]',
    mt: isEven ? '' : 'mt-0 md:mt-8',
  };
}
