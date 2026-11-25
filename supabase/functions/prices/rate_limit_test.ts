import { rejects } from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPostgresRateLimiter } from "./rate_limit.ts";

const fakeClient = (result: { data: unknown; error: { message: string } | null }) =>
  ({ rpc: () => Promise.resolve(result) }) as unknown as SupabaseClient;

Deno.test("the Postgres rate limiter throws on unusable RPC results", async () => {
  const results = [
    { data: null, error: { message: "permission denied" } },
    { data: null, error: null },
    { data: "3", error: null },
  ];
  for (const result of results) {
    await rejects(createPostgresRateLimiter(fakeClient(result)).hit("u", new Date()));
  }
});
