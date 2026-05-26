import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

/**
 * サーバー専用（service_role / secret）— RLS をバイパスして daily_prompts へ保存
 * import 先: API Route / Server Component のみ（Client Component 禁止）
 */
export function createAdminClient() {
  const env = getSupabaseEnv();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!env.ok || !serviceKey) {
    return null;
  }

  return createClient<Database>(env.url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
