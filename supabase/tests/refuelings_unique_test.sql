-- Unique (vehicle_id, refueled_on, odometer_km) on refuelings (ADR 0012, #61).
begin;
select plan(4);

insert into auth.users (id, email) values ('cccccccc-0000-0000-0000-000000000000', 'c@test.local');
insert into public.vehicles (id, user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml) values
  ('cccccccc-0000-0000-0000-00000000000c', 'cccccccc-0000-0000-0000-000000000000', 'Polo', 'e5', 0, 45000),
  ('cccccccc-0000-0000-0000-0000000000cd', 'cccccccc-0000-0000-0000-000000000000', 'Fiesta', 'e5', 0, 45000);

insert into public.refuelings
  (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name) values
  ('cccccccc-0000-0000-0000-00000000000c', '2026-11-01', 30000, 1749, 5247, 1000, 'Aral');

select throws_ok(
  $$insert into public.refuelings
      (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('cccccccc-0000-0000-0000-00000000000c', '2026-11-01', 10000, 1749, 1749, 1000, 'Shell')$$,
  '23505', null, 'same vehicle, day and odometer is rejected');

select lives_ok(
  $$insert into public.refuelings
      (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('cccccccc-0000-0000-0000-00000000000c', '2026-11-01', 10000, 1749, 1749, 1100, 'Shell')$$,
  'same day with a different odometer is allowed');

select lives_ok(
  $$insert into public.refuelings
      (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('cccccccc-0000-0000-0000-00000000000c', '2026-11-02', 10000, 1749, 1749, 1000, 'Shell')$$,
  'same odometer on another day is allowed by the database');

select lives_ok(
  $$insert into public.refuelings
      (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('cccccccc-0000-0000-0000-0000000000cd', '2026-11-01', 30000, 1749, 5247, 1000, 'Aral')$$,
  'same day and odometer on another vehicle is allowed');

select * from finish();
rollback;
