-- The price cache is only for the Edge Function (service role); app users must not read or write it.
begin;
select plan(5);

insert into public.price_cache (cache_key, payload, fetched_at)
values ('list:48.780:9.180:5', '{"stations": []}', now());

select ok((select relrowsecurity from pg_class where oid = 'public.price_cache'::regclass),
  'RLS is enabled on price_cache');

set local role anon;
select throws_ok('select 1 from public.price_cache', '42501', null, 'anon cannot read the cache');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}', true);
select throws_ok('select 1 from public.price_cache', '42501', null, 'authenticated cannot read the cache');
select throws_ok(
  $$insert into public.price_cache (cache_key, payload, fetched_at) values ('x', '{}', now())$$,
  '42501', null, 'authenticated cannot poison the cache');

set local role service_role;
select is((select count(*) from public.price_cache), 1::bigint, 'service role reads the cache');

select * from finish();
rollback;
