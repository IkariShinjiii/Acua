import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Public by design -- PayMongo can't send a Supabase JWT, so this is
// deployed with --no-verify-jwt (the same reason concierge-chat is). The
// signature check below is what actually authenticates every request; a
// request that fails it is discarded before anything else runs.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYMONGO_WEBHOOK_SECRET = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
// Live payments use the "li" signature, test-mode ones use "te" -- one
// endpoint receives both, and this decides which to check against. Leave
// unset (or "false") while wiring this up against PayMongo's test mode.
const IS_LIVE_MODE = Deno.env.get("PAYMONGO_LIVE_MODE") === "true";

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

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!header || !PAYMONGO_WEBHOOK_SECRET) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const timestamp = parts["t"];
  const expectedSig = IS_LIVE_MODE ? parts["li"] : parts["te"];
  if (!timestamp || !expectedSig) return false;

  const computed = await hmacSha256Hex(PAYMONGO_WEBHOOK_SECRET, `${timestamp}.${rawBody}`);
  return timingSafeEqual(computed, expectedSig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  if (!PAYMONGO_WEBHOOK_SECRET) {
    console.error("paymongo-webhook: missing PAYMONGO_WEBHOOK_SECRET");
    return jsonResponse({ error: "Webhook isn't set up yet." }, 503);
  }

  // Read the raw text FIRST -- verification is against the exact bytes
  // PayMongo signed, not a re-serialized copy of the parsed JSON.
  const rawBody = await req.text();
  const isValid = await verifySignature(rawBody, req.headers.get("Paymongo-Signature"));
  if (!isValid) {
    console.error("paymongo-webhook: signature verification failed");
    return jsonResponse({ error: "Invalid signature." }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid payload." }, 400);
  }

  const eventType: string | undefined = payload?.data?.attributes?.type;
  const resource = payload?.data?.attributes?.data;
  const metadata: Record<string, string> = resource?.attributes?.metadata ?? {};

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (metadata.checkout_group_id) {
      await handleCheckoutEvent(service, eventType, metadata.checkout_group_id, resource?.id);
    } else if (metadata.commission_brief_id) {
      await handleCommissionEvent(
        service,
        eventType,
        metadata.commission_brief_id,
        metadata.payment_stage,
        resource?.id
      );
    } else {
      console.error("paymongo-webhook: event with no recognized metadata", eventType);
    }
  } catch (err) {
    console.error("paymongo-webhook handling error:", err);
    // Still 200 -- PayMongo retries on non-2xx, and a bug on our side
    // logged above shouldn't cause it to keep hammering this endpoint.
  }

  return jsonResponse({ received: true });
});

async function handleCheckoutEvent(
  service: ReturnType<typeof createClient>,
  eventType: string | undefined,
  checkoutGroupId: string,
  paymentId: string | undefined
) {
  if (eventType === "payment.paid") {
    const { data: orders } = await service
      .from("orders")
      .select("id, product_id")
      .eq("checkout_group_id", checkoutGroupId);

    for (const order of orders ?? []) {
      const { data: product } = await service
        .from("products")
        .select("is_one_of_one")
        .eq("id", order.product_id)
        .single();
      if (product?.is_one_of_one) {
        await service.rpc("claim_product_if_available", { p_product_id: order.product_id });
      }
    }

    await service
      .from("orders")
      .update({ status: "processing", payment_intent_id: paymentId })
      .eq("checkout_group_id", checkoutGroupId);
  } else if (eventType === "payment.failed") {
    // These rows never represented a real completed order.
    await service
      .from("orders")
      .delete()
      .eq("checkout_group_id", checkoutGroupId)
      .eq("status", "awaiting_payment");
  }
}

async function handleCommissionEvent(
  service: ReturnType<typeof createClient>,
  eventType: string | undefined,
  commissionBriefId: string,
  stage: string | undefined,
  paymentId: string | undefined
) {
  if (eventType !== "payment.paid") return;

  if (stage === "deposit") {
    await service
      .from("commission_briefs")
      .update({
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        deposit_payment_intent_id: paymentId,
        status: "in_production",
      })
      .eq("id", commissionBriefId);
  } else if (stage === "balance") {
    await service
      .from("commission_briefs")
      .update({
        balance_paid_at: new Date().toISOString(),
        balance_payment_intent_id: paymentId,
        status: "delivered",
      })
      .eq("id", commissionBriefId);
  }
}
