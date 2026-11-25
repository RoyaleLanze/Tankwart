// Rate-limit counter in the table public.price_rate_limit, counted by one SQL function.
// Like the cache it needs the service role; app users may not execute the function.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimiter } from "./handler.ts";

export function createPostgresRateLimiter(client: SupabaseClient): RateLimiter {
  return {
    async hit(userId, windowStart) {
      const { data, error } = await client.rpc("hit_price_rate_limit", {
        p_user_id: userId,
        p_window_start: windowStart.toISOString(),
      });
      if (error) throw new Error(`Rate limit check failed: ${error.message}`);
      if (typeof data !== "number") throw new Error("Rate limit check returned no count");
      return data;
    },
  };
}
