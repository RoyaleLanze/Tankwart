-- Inserting the same refueling twice (a save retried with the same id, ADR 0017, #12).
-- The app tells a retry from a day/odometer clash by the constraint name in the error.
begin;
select plan(2);

insert into auth.users (id, email) values ('dddddddd-0000-0000-0000-000000000000', 'd@test.local');
insert into public.vehicles (id, user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml) values
  ('dddddddd-0000-0000-0000-00000000000d', 'dddddddd-0000-0000-0000-000000000000', 'Polo', 'e5', 0, 45000);

select lives_ok(
  $$insert into public.refuelings
      (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('dddddddd-0000-0000-0000-0000000000a1', 'dddddddd-0000-0000-0000-00000000000d',
            '2026-11-20', 30000, 1749, 5247, 1000, 'Aral')$$,
  'first insert with a fresh id works');

-- Same id and same day and odometer: both unique indexes are violated, Postgres must name the primary key.
select throws_ok(
  $$insert into public.refuelings
      (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('dddddddd-0000-0000-0000-0000000000a1', 'dddddddd-0000-0000-0000-00000000000d',
            '2026-11-20', 30000, 1749, 5247, 1000, 'Aral')$$,
  '23505',
  'duplicate key value violates unique constraint "refuelings_pkey"',
  'the identical row inserted again reports the primary key, not day and odometer');

select * from finish();
rollback;
