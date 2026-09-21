-- ACUA does not make metal jewelry (no solid gold/silver, no casting or
-- forging) — it makes handmade accessories mixing synthetic and natural
-- materials with premium components and non-tarnish beads/pendants. The
-- `metal` columns from 0001_init.sql wrongly implied precious-metal
-- construction; renaming to `material` to match reality (values become
-- things like "Non-Tarnish Gold-Tone Alloy" or "Natural & Synthetic Mix",
-- never an actual metal purity/karat claim).

alter table public.archive_items rename column metal to material;
alter table public.commission_briefs rename column metal to material;
