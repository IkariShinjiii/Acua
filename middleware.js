// Vercel Routing Middleware (runs on Vercel's edge before the static site
// is served; not part of the Vite bundle).
//
// Messenger, Instagram, WhatsApp etc. build a link preview by fetching the
// page as a bot and reading its <meta> tags — they don't run JavaScript, so
// a shared /?product=<id> link always previewed as the generic ACUA card.
// For those bots only, this serves index.html with that product's title,
// price, description and photo swapped into the preview tags. Everyone else
// (and any bot request that fails along the way) gets the normal site
// untouched.

export const config = {
  matcher: '/',
};

// Link-preview crawlers, not search engines: Google renders the page's
// JavaScript itself, and serving it different HTML isn't worth the risk.
const PREVIEW_BOTS =
  /facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|pinterest|viber|skypeuripreview|line\/|embedly|redditbot|applebot/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatPeso = (cents) => `₱${Math.round(cents / 100).toLocaleString('en-PH')}`;

function setMeta(html, attr, key, value) {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product');
  if (!productId || !UUID.test(productId)) return undefined;
  if (!PREVIEW_BOTS.test(request.headers.get('user-agent') || '')) return undefined;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return undefined;

  try {
    const [productRes, pageRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${productId}&select=title,description,price_cents,image_url,sold_out`,
        { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
      ),
      fetch(new URL('/index.html', request.url)),
    ]);
    if (!productRes.ok || !pageRes.ok) return undefined;
    const [product] = await productRes.json();
    if (!product) return undefined;

    const title = `${product.title} — ${formatPeso(product.price_cents)}${product.sold_out ? ' (sold out)' : ''} | ACUA`;
    const description = product.description || 'Handmade coastal accessories from Iloilo City, Philippines.';
    const pageUrl = `${url.origin}/?product=${productId}`;

    let html = await pageRes.text();
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = setMeta(html, 'name', 'description', description);
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', description);
    html = setMeta(html, 'property', 'og:url', pageUrl);
    html = setMeta(html, 'name', 'twitter:title', title);
    html = setMeta(html, 'name', 'twitter:description', description);
    if (product.image_url) {
      html = setMeta(html, 'property', 'og:image', product.image_url);
      html = setMeta(html, 'name', 'twitter:image', product.image_url);
      // The declared 1200x630 belongs to the default card, not this photo.
      html = html.replace(/\s*<meta\s+property="og:image:(width|height)"\s+content="[^"]*"\s*\/>/g, '');
    }
    html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${escapeHtml(pageUrl)}$2`);

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch {
    return undefined;
  }
}
