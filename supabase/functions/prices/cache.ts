// Price cache in the table public.price_cache. The client must use the service role,
// because the table has RLS without policies and app users cannot access it.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CacheEntry, PriceCache } from "./handler.ts";

export function createPostgresCache(client: SupabaseClient): PriceCache {
  return {
    async read(key) {
      const { data, error } = await client
        .from("price_cache")
        .select("payload, fetched_at")
        .eq("cache_key", key)
        .maybeSingle();
      if (error) throw new Error(`Price cache read failed: ${error.message}`);
      return toEntry(data);
    },
    async write(key, entry) {
      const { error } = await client.from("price_cache").upsert({
        cache_key: key,
        payload: entry.payload,
        fetched_at: entry.fetchedAt.toISOString(),
      });
      if (error) throw new Error(`Price cache write failed: ${error.message}`);
    },
    async deleteOlderThan(cutoff) {
      const { error } = await client
        .from("price_cache")
        .delete()
        .lt("fetched_at", cutoff.toISOString());
      if (error) throw new Error(`Price cache cleanup failed: ${error.message}`);
    },
  };
}

// The client has no generated schema types, so the row is checked here; a bad row is a cache miss.
function toEntry(row: unknown): CacheEntry | null {
  if (typeof row !== "object" || row === null) return null;
  const { payload, fetched_at } = row as Record<string, unknown>;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  if (typeof fetched_at !== "string") return null;
  const fetchedAt = new Date(fetched_at);
  if (Number.isNaN(fetchedAt.getTime())) return null;
  return { payload: payload as Record<string, unknown>, fetchedAt };
}
