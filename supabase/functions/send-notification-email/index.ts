import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Two events, for now: a patron submits a commission brief (notify the
// admin), and the admin sends a quote on one (notify the patron). Order
// notifications (new order, shipped) aren't wired yet -- checkout isn't
// live on main yet, so there's no real path that creates an order row to
// hang them off. Add those the same way once checkout ships.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Resend's shared test sender -- works with zero setup, but only delivers
// to the email the Resend account itself was created with. Once a real
// sending domain is verified (Resend dashboard -> Domains), set
// RESEND_FROM_EMAIL to an address on it, e.g. "ACUA <hello@acua.ph>", and
// every recipient works.
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "ACUA <onboarding@resend.dev>";
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "acuavibe@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

const formatPeso = (cents: number) => `₱${Math.round(cents / 100).toLocaleString("en-PH")}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  if (!RESEND_API_KEY) {
    // Deployed but not yet configured -- same honest-503 convention as
    // concierge-chat's missing GEMINI_API_KEY, rather than a generic 500.
    return jsonResponse({ error: "Email notifications aren't set up yet -- missing RESEND_API_KEY." }, 503);
  }

  let body: { type?: string; briefId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const { type, briefId } = body;
  if (!briefId || typeof briefId !== "string") {
    return jsonResponse({ error: "briefId is required." }, 400);
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (type === "new_brief") {
    // Atomic claim, same shape as claim_product_if_available (0001_init.sql):
    // only the caller whose UPDATE actually matched a still-unnotified row
    // sends the email, so replaying this call for the same brief -- a
    // retry, or a repeat call against the public submit path -- can never
    // double-email the admin.
    const { data: brief, error } = await serviceClient
      .from("commission_briefs")
      .update({ admin_notified_at: new Date().toISOString() })
      .eq("id", briefId)
      .is("admin_notified_at", null)
      .select("full_name, email, phone, category, material, budget_range, timeline, narrative")
      .single();

    if (error || !brief) {
      // Not an error from the caller's point of view: either this brief
      // was already notified, or it doesn't exist. Either way there's
      // nothing left to send.
      return jsonResponse({ sent: false });
    }

    try {
      await sendEmail(
        ADMIN_EMAIL,
        `New commission request from ${brief.full_name}`,
        `<h2>New commission request</h2>
         <p><strong>${escapeHtml(brief.full_name)}</strong> (${escapeHtml(brief.email)}${
          brief.phone ? `, ${escapeHtml(brief.phone)}` : ""
        })</p>
         <p><strong>Category:</strong> ${escapeHtml(brief.category)}<br/>
         <strong>Material:</strong> ${escapeHtml(brief.material)}<br/>
         <strong>Budget:</strong> ${escapeHtml(brief.budget_range)}<br/>
         <strong>Timeline:</strong> ${escapeHtml(brief.timeline)}</p>
         <p><strong>Details:</strong><br/>${escapeHtml(brief.narrative).replace(/\n/g, "<br/>")}</p>
         <p>Review it in the admin dashboard's Commission Pipeline tab.</p>`
      );
    } catch (err) {
      console.error("send-notification-email (new_brief) failed:", err);
      // The claim above already set admin_notified_at, but the email never
      // actually went out -- undo the claim so a later retry (once
      // whatever broke the send is fixed) can still succeed, instead of
      // this brief being silently marked "notified" forever over a send
      // that never happened.
      await serviceClient.from("commission_briefs").update({ admin_notified_at: null }).eq("id", briefId);
      return jsonResponse({ sent: false, error: "Email failed to send." }, 502);
    }
    return jsonResponse({ sent: true });
  }

  if (type === "quote_sent") {
    // Admin-only: verify the caller's own session, not just that a JWT was
    // present (verify_jwt on deploy already guarantees that much). Reads
    // through the anon-key client under the caller's own token so this
    // relies on the same "view own profile" RLS policy already in place
    // (0001_init.sql) rather than trusting anything the client claims.
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Not authenticated." }, 401);
    }
    const { data: profile } = await authClient
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    if (!profile?.is_admin) {
      return jsonResponse({ error: "Not authorized." }, 403);
    }

    const { data: brief, error } = await serviceClient
      .from("commission_briefs")
      .select("full_name, email, quote_price_cents")
      .eq("id", briefId)
      .single();
    if (error || !brief || brief.quote_price_cents == null) {
      return jsonResponse({ sent: false, error: "Brief not found or has no quote." }, 404);
    }

    try {
      await sendEmail(
        brief.email,
        "Your ACUA commission quote is ready",
        `<h2>Your quote is ready</h2>
         <p>Hi ${escapeHtml(brief.full_name)},</p>
         <p>We've put together a quote for your custom piece: <strong>${formatPeso(
           brief.quote_price_cents
         )}</strong>.</p>
         <p>Log in to your ACUA account and open My Account &rarr; Custom Commissions to review
         the concept and approve the quote whenever you're ready.</p>
         <p>&mdash; ACUA</p>`
      );
    } catch (err) {
      console.error("send-notification-email (quote_sent) failed:", err);
      return jsonResponse({ sent: false, error: "Email failed to send." }, 502);
    }
    return jsonResponse({ sent: true });
  }

  return jsonResponse({ error: `Unknown notification type: ${type}` }, 400);
});
