-- Short-lived cache for Tankerkönig responses (ADR 0005), keyed by request.
-- Only the prices Edge Function reads and writes it, using the service role.
create table public.price_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null
);

-- RLS without any policy: anon and authenticated get no rows; service_role bypasses RLS.
alter table public.price_cache enable row level security;
revoke all on public.price_cache from anon, authenticated;
