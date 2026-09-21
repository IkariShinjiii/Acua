-- Initial catalog seed, matching what was in src/data/products.js and
-- src/data/archive.js before the storefront was wired to real Supabase
-- queries. Not a migration (data, not schema) — run manually against a
-- fresh project via the SQL Editor, or `supabase db seed` with the CLI.
--
-- archive_items.material intentionally holds a MATERIAL_OPTIONS id
-- ('non-tarnish-gold-tone', not a human label) — that's what lets
-- "Request Similar Piece" pre-select the right option in the Commission
-- form. products.material is a human-readable description instead; the
-- two tables use the same column name for different display purposes.

insert into public.products (title, category, material, description, price_cents, image_url, fallback_image_url, is_one_of_one, sold_out) values
('Pearl Drop Chain', 'Necklaces', 'Non-Tarnish Gold-Tone Chain & Freshwater Pearl', 'A single, luminous freshwater pearl suspended on a hand-finished non-tarnish gold-tone chain.', 1000000, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', false, false),
('Hammered Stacking Set', 'Rings', 'Non-Tarnish Silver-Tone Alloy', 'Trio of slim, organically textured stacking bands finished in non-tarnish silver-tone to evoke gentle coastal tide lines.', 850000, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80', false, false),
('Woven Sand Bracelet', 'Bracelets', 'Non-Tarnish Gold-Tone Beads & Waxed Cord', 'Intricately braided waxed cord with a sculptural non-tarnish gold-tone clasp inspired by windswept coastal grass.', 1600000, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1611591475887-f8232bfdf1fb?auto=format&fit=crop&w=1000&q=80', false, true),
('Solitary Tidal Ear Cuff', 'Earrings', 'Non-Tarnish Silver-Tone Alloy', 'Textured non-tarnish silver-tone ear cuff designed to hug the upper ear curve comfortably without piercing.', 800000, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1000&q=80', false, false),
('Dune Texture Ring', 'Rings', 'Non-Tarnish Gold-Tone Alloy', 'Substantially weighted band hand-finished with hammered-texture facets that catch the ocean light.', 2700000, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80', false, false),
('Azure Drop Pendant', 'Necklaces', 'Natural Aquamarine Chip & Non-Tarnish Silver-Tone Setting', 'Raw natural aquamarine chips set by hand in a non-tarnish silver-tone pendant setting.', 1350000, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80', false, false);

insert into public.archive_items (title, category, material, image_url, alt_text) values
('Raw Sapphire Ring', 'Sculptural Ring', 'non-tarnish-silver-tone', 'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80', 'Custom ring featuring an uncut raw sapphire set in a non-tarnish silver-tone setting on dark slate rock'),
('Sculpted Gold-Tone Pendant', 'Necklace / Choker', 'non-tarnish-gold-tone', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80', 'Sculptural non-tarnish gold-tone pendant shaped like melted wax or a molten pour'),
('Sea Glass Chain', 'Necklace / Choker', 'non-tarnish-silver-tone', 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80', 'Delicate non-tarnish silver-tone chain with sea-green seaglass charm resting on textured linen'),
('Textured Drop Earrings', 'Artisanal Earrings', 'non-tarnish-gold-tone', 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80', 'Statement earrings made of textured non-tarnish gold-tone alloy and irregular freshwater pearls on warm sand');
