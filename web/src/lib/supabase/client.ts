import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { formatSupabaseEnvError, getSupabaseEnv } from "@/lib/supabase/env";

/**
 * ブラウザ（Client Component）用 Supabase クライアント
 */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env.ok) {
    throw new Error(formatSupabaseEnvError(env.missing));
  }

  return createBrowserClient<Database>(env.url, env.publishableKey);
}
