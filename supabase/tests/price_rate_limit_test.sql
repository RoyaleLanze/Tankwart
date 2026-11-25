-- The rate-limit counter is only for the Edge Function (service role); app users must
-- neither read nor reset it, and must not call the counting function themselves.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local');
insert into public.price_rate_limit (user_id, window_start, count)
values ('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00', 3);

select ok((select relrowsecurity from pg_class where oid = 'public.price_rate_limit'::regclass),
  'RLS is enabled on price_rate_limit');

set local role anon;
select throws_ok('select 1 from public.price_rate_limit', '42501', null, 'anon cannot read the counter');
select throws_ok(
  $$select public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', now())$$,
  '42501', null, 'anon cannot call the counting function');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);
select throws_ok('select 1 from public.price_rate_limit', '42501', null, 'authenticated cannot read the counter');
select throws_ok(
  $$delete from public.price_rate_limit$$,
  '42501', null, 'authenticated cannot reset the counter');
select throws_ok(
  $$insert into public.price_rate_limit (user_id, window_start, count)
    values ('aaaaaaaa-0000-0000-0000-000000000000', now(), 1)$$,
  '42501', null, 'authenticated cannot write the counter');
select throws_ok(
  $$select public.hit_price_rate_limit('aaaaaaaa-0000-0000-0000-000000000000', now())$$,
  '42501', null, 'authenticated cannot call the counting function');

set local role service_role;
select is((select count from public.price_rate_limit), 3, 'service role reads the counter');
select is(
  public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00'),
  4, 'a call in the same window increments the count');
select is(
  public.hit_price_rate_limit('aaaaaaaa-0000-0000-0000-000000000000', '2026-11-25 12:00:00+00'),
  1, 'each user has their own counter');
select is(
  public.hit_price_rate_limit('bbbbbbbb-0000-0000-0000-000000000000', '2026-11-25 12:01:00+00'),
  1, 'a new window starts at 1');
select is((select count(*) from public.price_rate_limit), 1::bigint,
  'rows of earlier windows are deleted');

select * from finish();
rollback;
