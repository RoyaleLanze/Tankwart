-- RLS tests with two users (M14): user A must neither read nor write user B's data.
-- Silent RLS effects (0 rows updated/deleted) are verified afterwards as postgres.
begin;
select plan(45);

-- Fixtures, created as postgres (bypasses RLS).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');

insert into public.vehicles (id, user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000', 'Golf', 'e10', 1000, 50000),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000', 'Passat', 'diesel', 2000, 60000);

insert into public.refuelings
  (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name, note) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-00000000000a', '2026-11-01', 40000, 1749, 6996, 1500, 'Aral', null),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-02', 45000, 1659, 7466, 2500, 'Shell', 'orig');

update public.profiles set active_vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
where id = 'bbbbbbbb-0000-0000-0000-000000000000';

-- Setup checks.
select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.profiles'::regclass, 'public.vehicles'::regclass, 'public.refuelings'::regclass)),
  'RLS is enabled on all tables');
select is(
  (select count(*) from public.profiles
   where id in ('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000')),
  2::bigint, 'trigger creates a profile for every new user');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'authenticated cannot call the security definer trigger function');
select ok(not has_function_privilege('anon', 'public.handle_new_user()', 'execute'),
  'anon cannot call the security definer trigger function');

-- Anonymous users: no claims, no rows, no writes.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok('select 1 from public.vehicles', '42501', null, 'anon cannot read vehicles');
select throws_ok('select 1 from public.refuelings', '42501', null, 'anon cannot read refuelings');
select throws_ok('select 1 from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok(
  $$insert into public.vehicles (user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'Anon', 'e5', 0, 40000)$$,
  '42501', null, 'anon cannot create vehicles');

-- Act as user A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);

select results_eq('select id from public.vehicles', $$values ('aaaaaaaa-0000-0000-0000-00000000000a'::uuid)$$,
  'A sees only own vehicles');
select results_eq('select id from public.refuelings', $$values ('aaaaaaaa-0000-0000-0000-0000000000f1'::uuid)$$,
  'A sees only refuelings of own vehicles');
select results_eq('select id from public.profiles', $$values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid)$$,
  'A sees only own profile');

-- A works with own data, as the app will (user_id comes from the default).
select lives_ok(
  $$insert into public.vehicles (id, name, fuel_type, initial_odometer_km, tank_capacity_ml)
    values ('aaaaaaaa-0000-0000-0000-00000000000c', 'Polo', 'e5', 0, 40000)$$,
  'A can create an own vehicle without passing user_id');
select lives_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('aaaaaaaa-0000-0000-0000-00000000000a', '2026-11-10', 30000, 1700, 5100, 1900, 'Esso')$$,
  'A can add a refueling to an own vehicle');
update public.vehicles set name = 'Golf GTI' where id = 'aaaaaaaa-0000-0000-0000-00000000000a';
select is((select name from public.vehicles where id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 'Golf GTI',
  'A can update an own vehicle');
update public.profiles set active_vehicle_id = 'aaaaaaaa-0000-0000-0000-00000000000a'
where id = 'aaaaaaaa-0000-0000-0000-000000000000';
select is((select active_vehicle_id from public.profiles), 'aaaaaaaa-0000-0000-0000-00000000000a'::uuid,
  'A can set an own vehicle as active');

-- A attacks B: rejected writes.
select throws_ok(
  $$insert into public.vehicles (user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml)
    values ('bbbbbbbb-0000-0000-0000-000000000000', 'Fake', 'e5', 0, 40000)$$,
  '42501', null, 'A cannot create a vehicle for B');
select throws_ok(
  $$update public.vehicles set user_id = 'bbbbbbbb-0000-0000-0000-000000000000'
    where id = 'aaaaaaaa-0000-0000-0000-00000000000c'$$,
  '42501', null, 'A cannot hand an own vehicle over to B');
select throws_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-03', 10000, 1700, 1700, 2600, 'Esso')$$,
  '42501', null, 'A cannot add a refueling to B''s vehicle');
-- Same key as B's refueling: RLS must answer before the unique index, so 23505 never reveals B's data (#61).
select throws_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-02', 10000, 1700, 1700, 2500, 'Esso')$$,
  '42501', null, 'A colliding with B''s refueling gets 42501, not 23505');
-- Client-chosen ids (ADR 0017): B's id on A's own vehicle only hits the primary key (#120).
select throws_ok(
  $$insert into public.refuelings (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-00000000000a', '2026-11-05', 10000, 1700, 1700, 1700, 'Esso')$$,
  '23505', 'duplicate key value violates unique constraint "refuelings_pkey"',
  'A reusing B''s refueling id on an own vehicle gets 23505 on the primary key');
select throws_ok(
  $$insert into public.refuelings (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-00000000000a', '2026-11-05', 10000, 1700, 1700, 1700, 'Esso')
    on conflict (id) do update set note = 'Hacked', vehicle_id = excluded.vehicle_id$$,
  '42501', null, 'A cannot upsert over B''s refueling');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000000","role":"authenticated"}', true);
select results_eq(
  $$select vehicle_id, note, odometer_km from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2'$$,
  $$values ('bbbbbbbb-0000-0000-0000-00000000000b'::uuid, 'orig'::text, 2500)$$,
  'B''s refueling is unchanged after the id collisions');
select is((select count(*) from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2'), 1::bigint,
  'B still sees exactly one row with that id');
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);
select throws_ok(
  $$update public.refuelings set vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
    where id = 'aaaaaaaa-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'A cannot move a refueling to B''s vehicle');
select throws_ok(
  $$update public.profiles set active_vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
    where id = 'aaaaaaaa-0000-0000-0000-000000000000'$$,
  '42501', null, 'A cannot set B''s vehicle as active');
select throws_ok($$insert into public.profiles (id) values ('bbbbbbbb-0000-0000-0000-000000000000')$$,
  '42501', null, 'A cannot create profiles');

-- A attacks B: silently ignored writes, verified below.
update public.vehicles set name = 'Hacked' where id = 'bbbbbbbb-0000-0000-0000-00000000000b';
update public.refuelings set note = 'Hacked' where id = 'bbbbbbbb-0000-0000-0000-0000000000f2';
update public.profiles set active_vehicle_id = null where id = 'bbbbbbbb-0000-0000-0000-000000000000';
delete from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2';
delete from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-00000000000b';
delete from public.profiles;

-- A deletes the active vehicle: refuelings cascade, active vehicle is reset.
delete from public.vehicles where id = 'aaaaaaaa-0000-0000-0000-00000000000a';

reset role;
select is((select name from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-00000000000b'), 'Passat',
  'A cannot update or delete B''s vehicle');
select is((select note from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2'), 'orig',
  'A cannot update or delete B''s refueling');
select is((select active_vehicle_id from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000000'),
  'bbbbbbbb-0000-0000-0000-00000000000b'::uuid, 'A cannot change B''s profile');
select is(
  (select count(*) from public.profiles
   where id in ('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000')),
  2::bigint, 'nobody can delete profiles');
select is((select user_id from public.vehicles where id = 'aaaaaaaa-0000-0000-0000-00000000000c'),
  'aaaaaaaa-0000-0000-0000-000000000000'::uuid, 'user_id defaults to the signed-in user');
select is((select count(*) from public.refuelings where vehicle_id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 0::bigint,
  'deleting a vehicle deletes its refuelings');
select is((select active_vehicle_id from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000000'), null,
  'deleting the active vehicle resets it to null');

-- Simple CHECKs from ADR 0012 (as postgres, on B's vehicle).
create function pg_temp.add_refueling(price int = 1700, volume int = 10000, total int = 1700, km int = 2600, station text = 'Esso')
returns void language sql as $$
  insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
  values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-03', volume, price, total, km, station);
$$;
create function pg_temp.add_vehicle(tank int = 40000, initial int = 0, consumption int = null, vehicle_name text = 'Polo')
returns void language sql as $$
  insert into public.vehicles (user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml, manufacturer_consumption_ml_per_100km)
  values ('bbbbbbbb-0000-0000-0000-000000000000', vehicle_name, 'e5', initial, tank, consumption);
$$;

select lives_ok('select pg_temp.add_refueling(price => 500)', 'price of 0.500 €/L is allowed');
-- Own odometer, because day and km of a vehicle are unique (#61).
select lives_ok('select pg_temp.add_refueling(price => 4000, km => 2700)', 'price of 4.000 €/L is allowed');
select throws_ok('select pg_temp.add_refueling(price => 499)', '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_price_per_liter_tenth_cents_check"',
  'price below 0.50 €/L is rejected');
select throws_ok('select pg_temp.add_refueling(price => 4001)', '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_price_per_liter_tenth_cents_check"',
  'price above 4.00 €/L is rejected');
select throws_ok('select pg_temp.add_refueling(volume => 0)', '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_volume_ml_check"', 'zero liters are rejected');
select throws_ok('select pg_temp.add_refueling(total => 0)', '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_total_cents_check"', 'zero total is rejected');
select throws_ok('select pg_temp.add_refueling(km => -1)', '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_odometer_km_check"', 'negative km are rejected');
select throws_ok($$select pg_temp.add_refueling(station => '  ')$$, '23514',
  'new row for relation "refuelings" violates check constraint "refuelings_station_name_check"', 'blank station is rejected');
select throws_ok('select pg_temp.add_vehicle(tank => 0)', '23514',
  'new row for relation "vehicles" violates check constraint "vehicles_tank_capacity_ml_check"', 'zero tank size is rejected');
select throws_ok('select pg_temp.add_vehicle(initial => -1)', '23514',
  'new row for relation "vehicles" violates check constraint "vehicles_initial_odometer_km_check"', 'negative initial km are rejected');
select throws_ok('select pg_temp.add_vehicle(consumption => 0)', '23514',
  'new row for relation "vehicles" violates check constraint "vehicles_manufacturer_consumption_ml_per_100km_check"',
  'zero manufacturer consumption is rejected');
select throws_ok($$select pg_temp.add_vehicle(vehicle_name => '  ')$$, '23514',
  'new row for relation "vehicles" violates check constraint "vehicles_name_check"', 'blank vehicle name is rejected');

select * from finish();
rollback;
