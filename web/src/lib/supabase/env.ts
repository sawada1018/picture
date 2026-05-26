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

export type EnvCheckItem = {
  name: string;
  ok: boolean;
  hint?: string;
};

/** ログイン画面・診断用（値は返さない） */
export function getRequiredEnvChecklist(): EnvCheckItem[] {
  const env = getSupabaseEnv();
  const hasSecret = !!getSupabaseServiceRoleKey();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();

  return [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      ok: env.ok,
      hint: env.ok ? undefined : "Supabase → Settings → API → Project URL",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ok: env.ok,
      hint: env.ok
        ? undefined
        : "Publishable key（sb_publishable_...）または NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    {
      name: "SUPABASE_SECRET_KEY",
      ok: hasSecret,
      hint: hasSecret
        ? undefined
        : "Secret key（sb_secret_...）。NEXT_PUBLIC_ は付けない",
    },
    {
      name: "NEXT_PUBLIC_SITE_URL",
      ok: !!siteUrl,
      hint: siteUrl
        ? undefined
        : vercelHost
          ? `例: https://${vercelHost}`
          : "本番の Vercel URL（https://〜.vercel.app）",
    },
  ];
}

export function getSupabaseEnv(): SupabaseEnv {
  const rawUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  )?.trim();
  const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : undefined;
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
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
  const where =
    process.env.VERCEL === "1"
      ? "Vercel の Project Settings → Environment Variables（Root Directory は web）"
      : "web/.env.local";
  return `Supabase の環境変数が未設定です: ${missing.join(", ")}。${where} を確認してください。`;
}

/** 本番（Vercel）向けの設定手順をログイン画面などで表示する */
export function supabaseEnvSetupHint(): string {
  if (process.env.VERCEL === "1") {
    return "Vercel ダッシュボード → Settings → Environment Variables に登録し、保存後に Redeploy してください。";
  }
  return "web/.env.local を作成し、dev サーバーを再起動してください。";
}
