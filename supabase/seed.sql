-- Local development data only (applied by `supabase db reset`, never pushed to the cloud).
-- Two test users with refuelings over about 12 months (Corsa about 10), the last one
-- at most two days before the reset:
--   nutzer-a@tankwart.local / tankwart-lokal  (Golf E10 and Corsa E5, Golf active)
--   nutzer-b@tankwart.local / tankwart-lokal  (Passat Diesel)
-- The rows follow the app rules from M4: increasing km, 0.50–4.00 €/L,
-- liters <= tank size x 1.1, no date in the future, at most one refueling per vehicle and day.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('tankwart-lokal', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('5eed0000-0000-4000-8000-00000000000a'::uuid, 'nutzer-a@tankwart.local'),
  ('5eed0000-0000-4000-8000-00000000000b'::uuid, 'nutzer-b@tankwart.local')
) as u (id, email);

-- Email sign-in looks up the identity, not only the user row.
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now()
from auth.users
where email like '%@tankwart.local';

insert into public.vehicles (
  id, user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml,
  make_model, license_plate, manufacturer_consumption_ml_per_100km
) values
  ('5eed0000-0000-4000-8000-0000000000a1', '5eed0000-0000-4000-8000-00000000000a',
   'Golf', 'e10', 48200, 50000, 'VW Golf VII 1.5 TSI', 'KA-TW 101', 5800),
  ('5eed0000-0000-4000-8000-0000000000a2', '5eed0000-0000-4000-8000-00000000000a',
   'Corsa', 'e5', 91500, 45000, 'Opel Corsa F', 'KA-TW 202', 5400),
  ('5eed0000-0000-4000-8000-0000000000b1', '5eed0000-0000-4000-8000-00000000000b',
   'Passat', 'diesel', 132000, 66000, 'VW Passat Variant 2.0 TDI', 'S-TW 303', 5200);

update public.profiles set active_vehicle_id = '5eed0000-0000-4000-8000-0000000000a1'
where id = '5eed0000-0000-4000-8000-00000000000a';
update public.profiles set active_vehicle_id = '5eed0000-0000-4000-8000-0000000000b1'
where id = '5eed0000-0000-4000-8000-00000000000b';

-- Refuelings are generated per vehicle from a few parameters, deterministic (no random()).
-- Every 10th refueling (i % 10 = 4) is a partial fill 5 L short of full; the next full fill
-- tops up those 5 L, so the full-tank method still sees realistic consumption.
-- 5 L keeps that next fill below the tank capacity of every vehicle.
with plan (vehicle_id, fills, every_days, base_km, ml_per_km, base_price, stations) as (values
  ('5eed0000-0000-4000-8000-0000000000a1'::uuid, 26, 14, 560, 64, 1720,
   array['Aral|Durlacher Allee 50, 76131 Karlsruhe', 'JET|Rheinhafenstraße 10, 76189 Karlsruhe',
         'Shell|Ettlinger Straße 2, 76137 Karlsruhe']),
  ('5eed0000-0000-4000-8000-0000000000a2'::uuid, 6, 60, 480, 58, 1790,
   array['Esso|Kriegsstraße 120, 76135 Karlsruhe', 'Aral|Durlacher Allee 50, 76131 Karlsruhe']),
  ('5eed0000-0000-4000-8000-0000000000b1'::uuid, 17, 21, 880, 60, 1640,
   array['Shell|Heilbronner Straße 300, 70469 Stuttgart', 'TotalEnergies|Pragstraße 20, 70376 Stuttgart',
         'JET|Neckartalstraße 5, 70376 Stuttgart'])
),
fills as (
  select
    p.vehicle_id, p.stations, i,
    current_date - (p.fills - 1 - i) * p.every_days - i % 3 as refueled_on,
    v.initial_odometer_km + (i + 1) * p.base_km + i * 37 % 120 as odometer_km,
    p.ml_per_km + i * 7 % 9 - 4 as ml_per_km,
    p.base_price + round(50 * sin(i * 0.5))::int + i * 29 % 40 - 20 as price,
    i % 10 = 4 and i < p.fills - 1 as partial
  from plan p
  join public.vehicles v on v.id = p.vehicle_id
  cross join generate_series(0, p.fills - 1) as i
),
volumes as (
  select f.*,
    (odometer_km - lag(odometer_km, 1, v.initial_odometer_km) over w) * ml_per_km
      - case when partial then 5000 else 0 end
      + case when lag(partial, 1, false) over w then 5000 else 0 end as volume_ml
  from fills f
  join public.vehicles v on v.id = f.vehicle_id
  window w as (partition by f.vehicle_id order by i)
)
insert into public.refuelings (
  vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents,
  odometer_km, station_name, station_address, is_full_tank
)
select
  vehicle_id, refueled_on, volume_ml, price,
  round(volume_ml::numeric * price / 10000)::int,
  odometer_km,
  split_part(stations[1 + i % cardinality(stations)], '|', 1),
  split_part(stations[1 + i % cardinality(stations)], '|', 2),
  not partial
from volumes;
