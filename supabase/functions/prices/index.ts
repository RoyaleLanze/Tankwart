// Edge Function "prices": the only way from the app to Tankerkönig (ADR 0005).
// Secrets: TANKERKOENIG_API_KEY (real prices) or PRICES_MOCK=true (fixed sample prices).
import { createClient } from "@supabase/supabase-js";
import { createPostgresCache } from "./cache.ts";
import { createHandler } from "./handler.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

// Only signed-in users; an anon key has no user and is rejected here.
async function isAuthenticated(req: Request): Promise<boolean> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) return false;
  const { data, error } = await admin.auth.getUser(token);
  return !error && data.user !== null;
}

Deno.serve(
  createHandler({
    isAuthenticated,
    cache: createPostgresCache(admin),
    fetch,
    apiKey: Deno.env.get("TANKERKOENIG_API_KEY"),
    mock: Deno.env.get("PRICES_MOCK") === "true",
    now: () => new Date(),
  }),
);
