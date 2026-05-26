import {
  getSiteUrl,
  getSupabaseEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * 設定診断（秘密鍵の値は返さない）
 * http://localhost:3002/api/health
 */
export async function GET() {
  const env = getSupabaseEnv();
  const hasSecret = !!getSupabaseServiceRoleKey();

  const checks: Record<string, { ok: boolean; detail: string }> = {
    supabaseUrl: {
      ok: env.ok,
      detail: env.ok ? env.url : env.missing.join(", "),
    },
    publishableKey: {
      ok: env.ok,
      detail: env.ok ? "設定済み" : "未設定",
    },
    secretKey: {
      ok: hasSecret,
      detail: hasSecret ? "設定済み（サーバー専用）" : "未設定",
    },
    siteUrl: {
      ok: !!getSiteUrl(),
      detail: getSiteUrl() ?? "未設定",
    },
    vercelEnv: {
      ok: true,
      detail: process.env.VERCEL_ENV ?? "local",
    },
  };

  let dbTables: Record<string, string> = {};
  const admin = createAdminClient();
  if (admin) {
    const { error: usersIdErr } = await admin
      .from("users")
      .select("id")
      .limit(1);
    dbTables.users = usersIdErr
      ? `テーブルなし: ${usersIdErr.message}`
      : "OK（テーブルあり）";

    const { error: usersColErr } = await admin
      .from("users")
      .select("id, display_name, friend_code")
      .limit(1);
    dbTables.users_columns = usersColErr
      ? `列不足 → FIX_NOW.sql を実行: ${usersColErr.message}`
      : "OK（display_name / friend_code あり）";

    for (const table of ["pairs", "drawings"] as const) {
      const { error } = await admin.from(table).select("id").limit(1);
      dbTables[table] = error
        ? `エラー: ${error.message}`
        : "OK（テーブルあり）";
    }

    const { error: promptsErr } = await admin
      .from("daily_prompts")
      .select("id, prompt, created_at")
      .limit(1);
    dbTables.daily_prompts = promptsErr
      ? `エラー: ${promptsErr.message}`
      : "OK（id, prompt, created_at）";

    const { data: bucket, error: bucketErr } = await admin.storage.getBucket(
      "drawings"
    );
    dbTables.storage_drawings_bucket = bucketErr
      ? `なし → STORAGE_NOW.sql を実行: ${bucketErr.message}`
      : bucket?.public
        ? "OK（drawings・公開）"
        : "OK（drawings・非公開のため URL 閲覧に注意）";
  } else {
    dbTables = { note: "secret 未設定のため DB チェック省略" };
  }

  const allCoreOk =
    checks.supabaseUrl.ok &&
    checks.publishableKey.ok &&
    checks.secretKey.ok;

  return NextResponse.json({
    status: allCoreOk ? "partial" : "needs_config",
    message:
      "この JSON を見て .env.local と Supabase ダッシュボードを確認してください",
    checks,
    database: dbTables,
    nextSteps: [
      "複数の npm run dev を止めて1つだけ起動する",
      "テーブル不足時: DRAWINGS_NOW.sql / バケット不足時: npm run setup:storage",
      "Authentication → Google を有効化",
      `Redirect URL: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"}/auth/callback`,
      "お題はアプリ内の 365 個から自動で出ます（OpenAI は不要）",
    ],
  });
}
