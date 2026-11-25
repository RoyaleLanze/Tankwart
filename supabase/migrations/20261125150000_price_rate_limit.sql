-- Per-user counter of real Tankerkönig calls in fixed one-minute windows (ADR 0015, #75).
-- Only the prices Edge Function uses it, through the service role.
create table public.price_rate_limit (
  user_id uuid not null references auth.users (id) on delete cascade,
  window_start timestamptz not null,
  count integer not null check (count > 0),
  primary key (user_id, window_start)
);

-- Same protection as price_cache: RLS without any policy, no rights for app users.
alter table public.price_rate_limit enable row level security;
revoke all on public.price_rate_limit from anon, authenticated;

-- Counts one call atomically and returns the new count for this window.
-- The caller's rows of earlier windows are never read again, so they are deleted on the way.
-- Only the caller's: other users' rows stay untouched (no lock contention, no reset by clock skew).
create function public.hit_price_rate_limit(p_user_id uuid, p_window_start timestamptz)
returns integer
language sql
set search_path = ''
as $$
  delete from public.price_rate_limit
  where user_id = p_user_id and window_start < p_window_start;
  insert into public.price_rate_limit as r (user_id, window_start, count)
  values (p_user_id, p_window_start, 1)
  on conflict (user_id, window_start) do update set count = r.count + 1
  returning r.count;
$$;

revoke execute on function public.hit_price_rate_limit(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.hit_price_rate_limit(uuid, timestamptz) to service_role;
