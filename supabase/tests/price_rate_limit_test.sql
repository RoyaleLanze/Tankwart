-- The rate-limit counter is only for the Edge Function (service role); app users must
-- neither read nor reset it, and must not call the counting function themselves.
begin;
select plan(25);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');
insert into public.price_rate_limit (user_id, window_start, count)
values ('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00', 3);

select ok((select relrowsecurity from pg_class where oid = 'public.price_rate_limit'::regclass),
  'RLS is enabled on price_rate_limit');

-- The grants themselves, not only one denied call: Supabase grants execute on new
-- functions in public to anon and authenticated unless the migration revokes it.
select ok(not has_function_privilege('anon', 'public.hit_price_rate_limit(uuid,timestamptz)', 'execute'),
  'anon has no execute right on the counting function');
select ok(not has_function_privilege('authenticated', 'public.hit_price_rate_limit(uuid,timestamptz)', 'execute'),
  'authenticated has no execute right on the counting function');
select ok(
  (select p.proacl is not null and not exists (
     select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')
   from pg_proc p where p.oid = 'public.hit_price_rate_limit(uuid,timestamptz)'::regprocedure),
  'PUBLIC has no execute right on the counting function');
select ok(has_function_privilege('service_role', 'public.hit_price_rate_limit(uuid,timestamptz)', 'execute'),
  'service role may execute the counting function');

set local role anon;
select throws_ok('select 1 from public.price_rate_limit', '42501',
  'permission denied for table price_rate_limit', 'anon cannot read the counter');
select throws_ok(
  $$insert into public.price_rate_limit (user_id, window_start, count)
    values ('aaaaaaaa-0000-0000-0000-000000000000', now(), 1)$$,
  '42501', 'permission denied for table price_rate_limit', 'anon cannot write the counter');
select throws_ok('update public.price_rate_limit set count = 1', '42501',
  'permission denied for table price_rate_limit', 'anon cannot change the counter');
select throws_ok('delete from public.price_rate_limit', '42501',
  'permission denied for table price_rate_limit', 'anon cannot reset the counter');
select throws_ok(
  $$select public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', now())$$,
  '42501', 'permission denied for function hit_price_rate_limit',
  'anon cannot call the counting function');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);
select throws_ok('select 1 from public.price_rate_limit', '42501',
  'permission denied for table price_rate_limit', 'authenticated cannot read the counter');
select throws_ok(
  $$insert into public.price_rate_limit (user_id, window_start, count)
    values ('aaaaaaaa-0000-0000-0000-000000000000', now(), 1)$$,
  '42501', 'permission denied for table price_rate_limit', 'authenticated cannot write the counter');
select throws_ok('update public.price_rate_limit set count = 1', '42501',
  'permission denied for table price_rate_limit', 'authenticated cannot change the counter');
select throws_ok('delete from public.price_rate_limit', '42501',
  'permission denied for table price_rate_limit', 'authenticated cannot reset the counter');
select throws_ok(
  $$select public.hit_price_rate_limit('aaaaaaaa-0000-0000-0000-000000000000', now())$$,
  '42501', 'permission denied for function hit_price_rate_limit',
  'authenticated cannot call the counting function');

set local role service_role;
select is((select count from public.price_rate_limit), 3, 'service role reads the counter');
select throws_ok(
  $$insert into public.price_rate_limit (user_id, window_start, count)
    values ('aaaaaaaa-0000-0000-0000-000000000000', now(), 0)$$,
  '23514', null, 'a count of 0 violates the check constraint');
select is(
  public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00'),
  4, 'a call in the same window increments the count');
select is(
  public.hit_price_rate_limit('aaaaaaaa-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00'),
  1, 'each user has their own counter');
select is(
  public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:01:00+00'),
  1, 'a new window starts at 1');
select is(
  (select count(*) from public.price_rate_limit
   where user_id = 'bbbbbbbb-0000-0000-0000-000000000000'),
  1::bigint, 'the caller''s rows of earlier windows are deleted');
select is(
  (select count from public.price_rate_limit
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000000' and window_start = '2026-11-25 12:00:00+00'),
  1, 'other users'' rows of earlier windows stay');

reset role;
select lives_ok(
  $$delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000000'$$,
  'a user can be deleted');
select is(
  (select count(*) from public.price_rate_limit
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000000'),
  0::bigint, 'deleting a user deletes their counter rows');
select is(
  (select count(*) from public.price_rate_limit
   where user_id = 'bbbbbbbb-0000-0000-0000-000000000000'),
  1::bigint, 'the other user''s counter rows stay');

select * from finish();
rollback;
