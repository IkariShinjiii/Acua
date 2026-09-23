import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PAYMONGO_SECRET_KEY = Deno.env.get("PAYMONGO_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL_FALLBACK = Deno.env.get("SITE_URL") ?? "https://acua-three.vercel.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYMONGO_API = "https://api.paymongo.com/v1";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function paymongoHeaders() {
  return {
    Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
    "Content-Type": "application/json",
  };
}

async function paymongoRequest(path: string, body: unknown) {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method: "POST",
    headers: paymongoHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const message = json?.errors?.[0]?.detail || "PayMongo request failed.";
    throw new Error(message);
  }
  return json;
}

// The one split point every amount on this brief derives from: deposit is
// half (rounded down to the peso), balance is whatever's left, so the two
// always add back up to the full quote exactly.
function splitQuote(quotePriceCents: number) {
  const deposit = Math.round(quotePriceCents / 2);
  return { deposit, balance: quotePriceCents - deposit };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  if (!PAYMONGO_SECRET_KEY) {
    return jsonResponse(
      { error: "Payments aren't set up yet — missing PAYMONGO_SECRET_KEY." },
      503
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Not signed in." }, 401);
  }

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await authedClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Not signed in." }, 401);
  }

  let body: { commission_brief_id?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const { commission_brief_id: briefId, stage } = body;
  if (!briefId || (stage !== "deposit" && stage !== "balance")) {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: brief, error: briefError } = await service
    .from("commission_briefs")
    .select("id, user_id, full_name, email, phone, status, quote_price_cents")
    .eq("id", briefId)
    .single();

  if (briefError || !brief) {
    return jsonResponse({ error: "Commission not found." }, 404);
  }
  // A brief submitted as a guest and never claimed (handle_new_user's
  // email-match trigger, on signup) has no user_id yet -- correctly
  // rejected here until they sign in with the same email it was submitted
  // under.
  if (brief.user_id !== user.id) {
    return jsonResponse({ error: "This commission isn't linked to your account yet." }, 403);
  }
  if (!brief.quote_price_cents) {
    return jsonResponse({ error: "No quote has been set for this commission yet." }, 409);
  }

  const expectedStatus = stage === "deposit" ? "quote_sent" : "awaiting_balance";
  if (brief.status !== expectedStatus) {
    return jsonResponse(
      { error: `This commission isn't ready for a ${stage} payment right now.` },
      409
    );
  }

  const { deposit, balance } = splitQuote(brief.quote_price_cents);
  const amountCents = stage === "deposit" ? deposit : balance;
  if (amountCents < 100) {
    return jsonResponse({ error: "That amount is too small to pay through GCash." }, 400);
  }

  const origin = req.headers.get("origin") || SITE_URL_FALLBACK;

  try {
    const intent = await paymongoRequest("/payment_intents", {
      data: {
        attributes: {
          amount: amountCents,
          currency: "PHP",
          payment_method_allowed: ["gcash"],
          description: `ACUA commission ${stage} — ${briefId}`,
          metadata: { commission_brief_id: briefId, payment_stage: stage },
        },
      },
    });
    const intentId = intent.data.id;
    const clientKey = intent.data.attributes.client_key;

    const method = await paymongoRequest("/payment_methods", {
      data: {
        attributes: {
          type: "gcash",
          billing: {
            name: brief.full_name,
            email: brief.email,
            phone: brief.phone ?? undefined,
          },
        },
      },
    });

    const attached = await paymongoRequest(`/payment_intents/${intentId}/attach`, {
      data: {
        attributes: {
          payment_method: method.data.id,
          client_key: clientKey,
          return_url: `${origin}/?commission=${briefId}&stage=${stage}`,
        },
      },
    });

    const redirectUrl = attached.data.attributes.next_action?.redirect?.url;
    if (!redirectUrl) {
      throw new Error("PayMongo didn't return a redirect URL.");
    }

    return jsonResponse({ redirect_url: redirectUrl, commission_brief_id: briefId });
  } catch (err) {
    console.error("create-commission-payment PayMongo error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Couldn't start payment. Please try again." },
      502
    );
  }
});
