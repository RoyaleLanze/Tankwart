-- Initial schema: profiles, vehicles, refuelings with RLS (ADR 0012).
-- Amounts are integers in their smallest unit; the unit is part of the column name.

create type public.fuel_type as enum ('e5', 'e10', 'diesel');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  fuel_type public.fuel_type not null,
  initial_odometer_km integer not null check (initial_odometer_km >= 0),
  tank_capacity_ml integer not null check (tank_capacity_ml > 0),
  make_model text,
  license_plate text,
  manufacturer_consumption_ml_per_100km integer check (manufacturer_consumption_ml_per_100km > 0),
  created_at timestamptz not null default now()
);

create index vehicles_user_id_idx on public.vehicles (user_id);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  active_vehicle_id uuid references public.vehicles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.refuelings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  refueled_on date not null,
  volume_ml integer not null check (volume_ml > 0),
  -- 0.50–4.00 €/L (M4), stored in tenths of a cent: 1.749 € = 1749.
  price_per_liter_tenth_cents integer not null
    check (price_per_liter_tenth_cents between 500 and 4000),
  total_cents integer not null check (total_cents >= 0),
  odometer_km integer not null check (odometer_km >= 0),
  -- Tankerkönig station UUID; null when entered as free text (M5).
  station_id uuid,
  station_name text not null check (length(trim(station_name)) > 0),
  station_address text,
  is_full_tank boolean not null default true,
  previous_missed boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create index refuelings_vehicle_id_refueled_on_idx on public.refuelings (vehicle_id, refueled_on);

-- Every new auth user gets a profile row.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: every user sees and changes only their own rows (M14).
alter table public.vehicles enable row level security;
alter table public.profiles enable row level security;
alter table public.refuelings enable row level security;

create policy "Users manage their own vehicles"
  on public.vehicles for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Profiles are created by the trigger and deleted with the user, so only select and update.
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users update their own profile with an own vehicle"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (
      active_vehicle_id is null
      or exists (
        select 1 from public.vehicles v
        where v.id = active_vehicle_id and v.user_id = (select auth.uid())
      )
    )
  );

-- Refuelings have no user_id; ownership is checked through the vehicle (ADR 0012).
create policy "Users manage refuelings of their own vehicles"
  on public.refuelings for all to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    )
  );
