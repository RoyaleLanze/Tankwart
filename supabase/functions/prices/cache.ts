// Price cache in the table public.price_cache. The client must use the service role,
// because the table has RLS without policies and app users cannot access it.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PriceCache } from "./handler.ts";

export function createPostgresCache(client: SupabaseClient): PriceCache {
  return {
    async read(key) {
      const { data, error } = await client
        .from("price_cache")
        .select("payload, fetched_at")
        .eq("cache_key", key)
        .maybeSingle();
      if (error) throw new Error(`Price cache read failed: ${error.message}`);
      return data ? { payload: data.payload, fetchedAt: new Date(data.fetched_at) } : null;
    },
    async write(key, entry) {
      const { error } = await client.from("price_cache").upsert({
        cache_key: key,
        payload: entry.payload,
        fetched_at: entry.fetchedAt.toISOString(),
      });
      if (error) throw new Error(`Price cache write failed: ${error.message}`);
    },
  };
}
