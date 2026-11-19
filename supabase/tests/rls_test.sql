-- RLS tests with two users (M14): user A must neither read nor write user B's data.
begin;
select plan(18);

-- Fixtures, created as postgres (bypasses RLS).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');

insert into public.vehicles (id, user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'aaaaaaaa-0000-0000-0000-000000000000', 'Golf', 'e10', 1000, 50000),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'bbbbbbbb-0000-0000-0000-000000000000', 'Passat', 'diesel', 2000, 60000);

insert into public.refuelings
  (id, vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-00000000000a', '2026-11-01', 40000, 1749, 6996, 1500, 'Aral'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-02', 45000, 1659, 7466, 2500, 'Shell');

update public.profiles set active_vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
where id = 'bbbbbbbb-0000-0000-0000-000000000000';

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.profiles'::regclass, 'public.vehicles'::regclass, 'public.refuelings'::regclass)),
  'RLS is enabled on all tables'
);
select is((select count(*) from public.profiles), 2::bigint, 'trigger creates a profile for every new user');

-- Act as user A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);

select results_eq('select id from public.vehicles', $$values ('aaaaaaaa-0000-0000-0000-00000000000a'::uuid)$$,
  'A sees only own vehicles');
select results_eq('select id from public.refuelings', $$values ('aaaaaaaa-0000-0000-0000-0000000000f1'::uuid)$$,
  'A sees only refuelings of own vehicles');
select results_eq('select id from public.profiles', $$values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid)$$,
  'A sees only own profile');

select throws_ok(
  $$insert into public.vehicles (user_id, name, fuel_type, initial_odometer_km, tank_capacity_ml)
    values ('bbbbbbbb-0000-0000-0000-000000000000', 'Fake', 'e5', 0, 40000)$$,
  '42501', null, 'A cannot create a vehicle for B');
select throws_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-03', 10000, 1700, 1700, 2600, 'Esso')$$,
  '42501', null, 'A cannot add a refueling to B''s vehicle');
select throws_ok(
  $$update public.refuelings set vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
    where id = 'aaaaaaaa-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'A cannot move a refueling to B''s vehicle');
select throws_ok(
  $$update public.profiles set active_vehicle_id = 'bbbbbbbb-0000-0000-0000-00000000000b'
    where id = 'aaaaaaaa-0000-0000-0000-000000000000'$$,
  '42501', null, 'A cannot set B''s vehicle as active');
select lives_ok(
  $$update public.profiles set active_vehicle_id = 'aaaaaaaa-0000-0000-0000-00000000000a'
    where id = 'aaaaaaaa-0000-0000-0000-000000000000'$$,
  'A can set an own vehicle as active');

-- Updates and deletes on B's rows silently match nothing under RLS; checked below as postgres.
update public.vehicles set name = 'Hacked' where id = 'bbbbbbbb-0000-0000-0000-00000000000b';
update public.refuelings set note = 'Hacked' where id = 'bbbbbbbb-0000-0000-0000-0000000000f2';
update public.profiles set active_vehicle_id = null where id = 'bbbbbbbb-0000-0000-0000-000000000000';
delete from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2';
delete from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-00000000000b';

-- A deletes the own vehicle: refuelings cascade, active vehicle is reset.
delete from public.vehicles where id = 'aaaaaaaa-0000-0000-0000-00000000000a';

-- Anonymous users see nothing.
set local role anon;
select is_empty('select 1 from public.vehicles union all select 1 from public.refuelings union all select 1 from public.profiles',
  'anon sees no rows');

reset role;
select is((select name from public.vehicles where id = 'bbbbbbbb-0000-0000-0000-00000000000b'), 'Passat',
  'A cannot update or delete B''s vehicle');
select is((select note from public.refuelings where id = 'bbbbbbbb-0000-0000-0000-0000000000f2'), null,
  'A cannot update or delete B''s refueling');
select is(
  (select active_vehicle_id from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000000'),
  'bbbbbbbb-0000-0000-0000-00000000000b'::uuid,
  'B''s profile stays untouched');
select is((select count(*) from public.refuelings where vehicle_id = 'aaaaaaaa-0000-0000-0000-00000000000a'), 0::bigint,
  'deleting a vehicle deletes its refuelings');
select is((select active_vehicle_id from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000000'), null,
  'deleting the active vehicle resets it to null');

-- Simple CHECKs from ADR 0012.
select throws_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-03', 10000, 4001, 4001, 2600, 'Esso')$$,
  '23514', null, 'price above 4.00 €/L is rejected');
select throws_ok(
  $$insert into public.refuelings (vehicle_id, refueled_on, volume_ml, price_per_liter_tenth_cents, total_cents, odometer_km, station_name)
    values ('bbbbbbbb-0000-0000-0000-00000000000b', '2026-11-03', 0, 1700, 0, 2600, 'Esso')$$,
  '23514', null, 'zero liters are rejected');

select * from finish();
rollback;
