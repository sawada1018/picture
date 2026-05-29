/**
 * メール確認・パスワード再設定のリダイレクト先（Supabase Redirect URLs に登録必須）
 */
export function getAuthCallbackUrl(): string {
  const siteFromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    // 本番では今開いている URL を優先（localhost 誤設定を避ける）
    if (!origin.includes("localhost")) {
      return `${origin}/auth/callback`;
    }
    if (siteFromEnv && !siteFromEnv.includes("localhost")) {
      return `${siteFromEnv}/auth/callback`;
    }
    return `${origin}/auth/callback`;
  }

  return siteFromEnv ? `${siteFromEnv}/auth/callback` : "/auth/callback";
}
