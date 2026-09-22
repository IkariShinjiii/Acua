-- The concierge chat endpoint is public and unauthenticated by design (see
-- concierge-chat/index.ts) with verify_jwt disabled, so until now its only
-- defense against abuse was the per-message length/history caps plus
-- Gemini's own free-tier limit. This adds a real per-client rate limit: a
-- fixed window of p_max_requests per p_window_seconds, keyed by IP address,
-- enforced atomically in a single upsert so concurrent requests from the
-- same client can't race past the limit.
create table if not exists public.concierge_rate_limits (
  client_key text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.concierge_rate_limits enable row level security;
-- No policies: neither anon nor authenticated can read or write this table
-- directly. The only sanctioned access is through the SECURITY DEFINER
-- function below, called by the edge function using the service role key.

create or replace function public.check_concierge_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.concierge_rate_limits (client_key, window_start, request_count)
  values (p_key, now(), 1)
  on conflict (client_key) do update
    set request_count = case
          when public.concierge_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else public.concierge_rate_limits.request_count + 1
        end,
        window_start = case
          when public.concierge_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else public.concierge_rate_limits.window_start
        end
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

-- Only the edge function (via the service role key) should ever call this —
-- exposing it to anon/authenticated would let a client bypass its own rate
-- limit by just not going through the real request path, or grief other
-- visitors by racing up someone else's counter. Revoking from PUBLIC alone
-- isn't enough (see 0006's own note on this) — Supabase's default setup
-- also grants EXECUTE directly to anon/authenticated on every new function
-- in this schema, confirmed via has_function_privilege() before and after:
-- both could still call it through revoke-from-public alone.
revoke execute on function public.check_concierge_rate_limit(text, integer, integer) from public;
revoke execute on function public.check_concierge_rate_limit(text, integer, integer) from anon, authenticated;
grant execute on function public.check_concierge_rate_limit(text, integer, integer) to service_role;
