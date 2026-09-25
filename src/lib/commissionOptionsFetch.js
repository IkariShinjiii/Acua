import { supabase } from './supabaseClient';

// Shared by every view that reads the Custom Commission form's
// admin-editable category/material lists (CommissionView, AdminView,
// PatronDashboardView) so the query only lives in one place. Returns null
// on any failure -- callers keep whatever they were already showing (the
// hardcoded defaults from data/commissionOptions.js) rather than blanking
// the form over a transient fetch error.
export async function fetchCommissionOptions() {
  const [categoriesRes, materialsRes] = await Promise.all([
    supabase.from('commission_categories').select('label').order('sort_order', { ascending: true }),
    supabase.from('commission_materials').select('id, label, note').order('sort_order', { ascending: true }),
  ]);
  if (categoriesRes.error || !categoriesRes.data || materialsRes.error || !materialsRes.data) {
    return null;
  }
  return {
    categories: categoriesRes.data.map((row) => row.label),
    materials: materialsRes.data,
  };
}
