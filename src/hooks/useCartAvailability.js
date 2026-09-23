import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePesoToNumber } from '../lib/currency';

// The cart is built from whatever product snapshot was saved to
// localStorage when each item was added — potentially days or weeks ago.
// If ACUA marks a piece sold out (most items are 1-of-1) after that, the
// cart would otherwise still happily offer to order it. Revalidates
// against the live table whenever `active` is true and the cart's item
// ids change — shared by CartDrawer (active while the drawer is open) and
// CheckoutView (active for as long as the checkout page is mounted), so
// both use the exact same race-safe check instead of two copies drifting
// apart.
export function useCartAvailability(items, active = true) {
  const [soldOutIds, setSoldOutIds] = useState(() => new Set());
  // Distinct from "nothing's sold out" — a failed revalidation used to
  // just leave soldOutIds at its initial empty Set, which looked exactly
  // like a real "everything's still available" result. On a dropped
  // connection this silently let a genuinely sold-out piece (most are
  // 1-of-1) stay fully orderable, with no sign the check had failed
  // rather than actually confirmed it.
  const [revalidationFailed, setRevalidationFailed] = useState(false);

  const itemIdsKey = items
    .map((i) => i.product.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!active || items.length === 0) return undefined;
    let cancelled = false;
    setRevalidationFailed(false);
    // A genuine network-level drop (not a normal query error response) was
    // found, live, to leave supabase-js's own promise permanently pending —
    // neither resolving with an error nor rejecting. Without this race,
    // that specific failure mode would silently reproduce the exact bug
    // this effect exists to fix: soldOutIds stuck at its initial empty Set
    // forever, indistinguishable from a real "nothing's sold out" result.
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Timed out' } }), 8000)
    );
    Promise.race([
      supabase
        .from('products')
        .select('id, sold_out')
        .in(
          'id',
          items.map((i) => i.product.id)
        ),
      timeout,
    ])
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setRevalidationFailed(true);
          return;
        }
        setSoldOutIds(new Set(data.filter((r) => r.sold_out).map((r) => r.id)));
      })
      .catch(() => {
        if (!cancelled) setRevalidationFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, itemIdsKey]);

  const availableItems = items.filter((i) => !soldOutIds.has(i.product.id));
  const availableSubtotalCents = availableItems.reduce(
    (sum, i) => sum + parsePesoToNumber(i.product.price) * 100 * i.quantity,
    0
  );

  return { soldOutIds, revalidationFailed, availableItems, availableSubtotalCents };
}
