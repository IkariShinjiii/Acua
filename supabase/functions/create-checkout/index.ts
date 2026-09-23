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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!PAYMONGO_SECRET_KEY) {
    return jsonResponse(
      { error: "Checkout isn't set up yet — missing PAYMONGO_SECRET_KEY." },
      503
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Not signed in." }, 401);
  }

  // Identifies the caller from their own JWT (forwarded automatically by
  // supabase.functions.invoke) rather than trusting a client-supplied user
  // id — the same reasoning every RLS policy in this project already
  // applies, just done manually here since this function runs as the
  // service role, outside RLS entirely.
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

  let body: { items?: unknown; shipping?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const shipping = body.shipping ?? {};
  if (items.length === 0) {
    return jsonResponse({ error: "Your cart is empty." }, 400);
  }
  const requiredShippingFields = ["name", "phone", "address", "city", "province", "zip"];
  for (const field of requiredShippingFields) {
    if (!String(shipping[field] ?? "").trim()) {
      return jsonResponse({ error: `Missing shipping field: ${field}.` }, 400);
    }
  }

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const productIds = items
    .map((i: Record<string, unknown>) => String(i?.product_id ?? ""))
    .filter(Boolean);
  const { data: products, error: productsError } = await service
    .from("products")
    .select("id, price_cents, sold_out, is_one_of_one")
    .in("id", productIds);

  if (productsError) {
    return jsonResponse({ error: "Couldn't verify your cart. Please try again." }, 500);
  }

  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  const lines: { product_id: string; quantity: number; price_cents: number }[] = [];

  for (const item of items) {
    const productId = String((item as Record<string, unknown>)?.product_id ?? "");
    const rawQuantity = Number((item as Record<string, unknown>)?.quantity ?? 1);
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.floor(rawQuantity) : 1;
    const product = productsById.get(productId);
    if (!product) {
      return jsonResponse({ error: "One of the pieces in your cart no longer exists." }, 409);
    }
    if (product.sold_out) {
      return jsonResponse({ error: "One of the pieces in your cart just sold out." }, 409);
    }
    if (product.is_one_of_one && quantity > 1) {
      return jsonResponse({ error: "Only one of a 1-of-1 piece can be ordered." }, 409);
    }
    lines.push({ product_id: productId, quantity, price_cents: product.price_cents });
  }

  const totalCents = lines.reduce((sum, l) => sum + l.price_cents * l.quantity, 0);
  if (totalCents < 100) {
    // PayMongo's own floor for a GCash payment intent is ₱1.00.
    return jsonResponse({ error: "Order total is too small to check out." }, 400);
  }

  const checkoutGroupId = crypto.randomUUID();
  const shippingColumns = {
    shipping_name: String(shipping.name).trim(),
    shipping_phone: String(shipping.phone).trim(),
    shipping_address: String(shipping.address).trim(),
    shipping_city: String(shipping.city).trim(),
    shipping_province: String(shipping.province).trim(),
    shipping_zip: String(shipping.zip).trim(),
    notes: shipping.notes ? String(shipping.notes).trim() : null,
  };

  const orderRows = lines.map((l) => ({
    user_id: user.id,
    product_id: l.product_id,
    quantity: l.quantity,
    total_cents: l.price_cents * l.quantity,
    status: "awaiting_payment",
    checkout_group_id: checkoutGroupId,
    ...shippingColumns,
  }));

  const { error: insertError } = await service.from("orders").insert(orderRows);
  if (insertError) {
    console.error("create-checkout insert error:", insertError);
    return jsonResponse({ error: "Couldn't create your order. Please try again." }, 500);
  }

  const origin = req.headers.get("origin") || SITE_URL_FALLBACK;

  try {
    const intent = await paymongoRequest("/payment_intents", {
      data: {
        attributes: {
          amount: totalCents,
          currency: "PHP",
          payment_method_allowed: ["gcash"],
          description: `ACUA order ${checkoutGroupId}`,
          metadata: { checkout_group_id: checkoutGroupId },
        },
      },
    });
    const intentId = intent.data.id;
    const clientKey = intent.data.attributes.client_key;

    await service
      .from("orders")
      .update({ payment_intent_id: intentId })
      .eq("checkout_group_id", checkoutGroupId);

    const method = await paymongoRequest("/payment_methods", {
      data: {
        attributes: {
          type: "gcash",
          billing: {
            name: shippingColumns.shipping_name,
            email: user.email,
            phone: shippingColumns.shipping_phone,
          },
        },
      },
    });

    const attached = await paymongoRequest(`/payment_intents/${intentId}/attach`, {
      data: {
        attributes: {
          payment_method: method.data.id,
          client_key: clientKey,
          return_url: `${origin}/?checkout=${checkoutGroupId}`,
        },
      },
    });

    const redirectUrl = attached.data.attributes.next_action?.redirect?.url;
    if (!redirectUrl) {
      throw new Error("PayMongo didn't return a redirect URL.");
    }

    return jsonResponse({ redirect_url: redirectUrl, checkout_group_id: checkoutGroupId });
  } catch (err) {
    console.error("create-checkout PayMongo error:", err);
    // The order rows made it in but payment setup failed -- they never
    // really happened, same as a failed webhook cleanup in paymongo-webhook.
    await service.from("orders").delete().eq("checkout_group_id", checkoutGroupId);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Couldn't start payment. Please try again." },
      502
    );
  }
});
