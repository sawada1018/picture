/**
 * Supabase 環境変数（新 publishable / 旧 anon 両対応）
 *
 * 秘密鍵は SUPABASE_SECRET_KEY のみ（NEXT_PUBLIC_ 付きにしない）
 */
export type SupabaseEnv =
  | { ok: true; url: string; publishableKey: string }
  | { ok: false; missing: string[] };

/** REST エンドポイント URL が貼られてもベース URL に直す */
export function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

export function getSupabaseEnv(): SupabaseEnv {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : undefined;
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY（または NEXT_PUBLIC_SUPABASE_ANON_KEY）"
    );
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, url: url!, publishableKey: publishableKey! };
}

/**
 * サーバー専用: service_role / secret キー
 * ※ フロント（Client Component）では絶対に使わないこと
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
}

export function formatSupabaseEnvError(missing: string[]): string {
  return `Supabase の環境変数が未設定です: ${missing.join(", ")}。web/.env.local を確認してください。`;
}
