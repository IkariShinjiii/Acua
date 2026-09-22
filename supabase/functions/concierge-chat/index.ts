import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Public and anonymous by design — visitors chat with this before ever
// signing in, the same way "Public can read products" already lets
// anyone browse the catalog without an account. verify_jwt is disabled
// on deploy for that reason; the real bound on abuse is the message/
// history caps below plus Gemini's own free-tier rate limit.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2000;

// Only real, already-published facts about ACUA — nothing about specific
// shipping windows, return policy, or legal terms, since none of that has
// real content yet anywhere else on the site either (see plan.md §18,
// which deliberately left those out of the footer for the same reason).
// The model is explicitly told not to invent anything past this.
const SYSTEM_PROMPT = `You are the concierge for ACUA, a handmade coastal accessories brand hand-assembled in Iloilo City, Philippines. You help visitors browsing the storefront.

Real facts you can rely on:
- Every piece is handmade in small batches; many are genuine 1-of-1 originals.
- Finishes are non-tarnish (gold-tone or silver-tone alloy), paired with natural stones, pearls, or salvaged sea glass.
- Ships nationwide from Iloilo City.
- There's no online checkout yet — a visitor adds pieces to their cart and it drafts an email to place the order; a custom commission gets a complimentary concept sketch and a fixed quote within 48 hours, with zero obligation to proceed.
- Custom commission categories: Necklace/Choker, Statement Cuff, Ceremonial/Suite. Materials: Non-Tarnish Gold-Tone Alloy, Non-Tarnish Silver-Tone Alloy, or a Natural & Synthetic Mix (premium beads, natural stone, and resin).
- Commission budget tiers run from roughly ₱22,000 up to ₱168,000+ depending on scope.
- Contact: acuavibe@gmail.com, @acua_ph on Instagram and TikTok.
- ACUA does not make rings or earrings.

You'll be given the current live catalog below — only recommend pieces that are actually listed, by their real name and price, and never suggest a piece marked SOLD OUT as available to buy (you can still mention it exists and suggest a similar commission instead).

If asked something you don't have real information for — shipping timelines, return policy, order status, pricing not shown here — say so plainly and point them to email or Instagram/TikTok rather than guessing. Keep replies short (2-4 sentences), warm, and specific. You are not able to add anything to their cart yourself — point them to the piece so they can do that themselves.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!GEMINI_API_KEY) {
    // Deployed but not yet configured — a clear, honest message instead of
    // a generic 500, since this is exactly the state right after first
    // deploying this function and before the secret is set.
    return jsonResponse(
      { error: "The concierge isn't set up yet — missing GEMINI_API_KEY." },
      503
    );
  }

  let messages: unknown;
  try {
    ({ messages } = await req.json());
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "No message provided." }, 400);
  }

  const trimmed = messages
    .slice(-MAX_HISTORY)
    .map((m: Record<string, unknown>) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content ?? "").slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0);

  if (trimmed.length === 0) {
    return jsonResponse({ error: "No message provided." }, 400);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: products } = await supabase
      .from("products")
      .select("title, category, material, price_cents, sold_out, is_one_of_one")
      .order("created_at", { ascending: false })
      .limit(40);

    const catalogSummary = (products ?? [])
      .map((p) => {
        const price = `₱${Math.round(p.price_cents / 100).toLocaleString("en-PH")}`;
        const flags = [p.sold_out ? "SOLD OUT" : null, p.is_one_of_one ? "1-of-1" : null]
          .filter(Boolean)
          .join(", ");
        return `- ${p.title} (${p.category}, ${p.material}) — ${price}${flags ? ` [${flags}]` : ""}`;
      })
      .join("\n");

    const systemInstruction = `${SYSTEM_PROMPT}\n\nCurrent catalog (Available Pieces):\n${
      catalogSummary || "(nothing currently listed)"
    }`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: trimmed.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return jsonResponse(
        { error: "The concierge is having trouble responding right now — please try again." },
        502
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ||
      "Sorry, I couldn't come up with a reply just then — could you try asking again?";

    return jsonResponse({ reply });
  } catch (err) {
    console.error("concierge-chat error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
});
