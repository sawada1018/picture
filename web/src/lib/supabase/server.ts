import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { formatSupabaseEnvError, getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server Component / Route Handler 用 Supabase クライアント
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env.ok) {
    throw new Error(formatSupabaseEnvError(env.missing));
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component からの書き込みは middleware が担当
        }
      },
    },
  });
}
