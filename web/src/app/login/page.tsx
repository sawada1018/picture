import { GuestStartForm } from "@/components/auth/guest-start-form";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { supabaseEnvSetupHint } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-5xl" aria-hidden>
            💕
          </span>
          <h1 className="mt-3 bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent">
            ふたりおえ
          </h1>
          <p className="mt-2 text-sm text-rose-400/90">
            名前を入れてすぐ開始。友達コードで二人につながる。
          </p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-xl shadow-rose-100/40 backdrop-blur">
          {error === "config" && (
            <div
              className="mb-4 rounded-xl bg-amber-50 px-3 py-3 text-left text-xs text-amber-900"
              role="alert"
            >
              <p className="font-bold">Supabase の設定が不足しています</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
                <li>SUPABASE_SECRET_KEY（サーバー用・保存 API など）</li>
                <li>NEXT_PUBLIC_SITE_URL（本番の Vercel URL）</li>
              </ul>
              <p className="mt-2 leading-relaxed">{supabaseEnvSetupHint()}</p>
              <p className="mt-1 text-[11px] text-amber-800/80">
                詳細: web/docs/VERCEL-DEPLOY.md
              </p>
            </div>
          )}
          {error === "auth" && (
            <p
              className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600"
              role="alert"
            >
              ログインに失敗しました。かんたん開始をお試しください。
            </p>
          )}

          {error !== "config" && <GuestStartForm />}

          {error !== "config" && (
            <details className="mt-6 group">
              <summary className="cursor-pointer text-center text-xs font-bold text-slate-400 hover:text-rose-500">
                Google でログイン（任意）
              </summary>
              <div className="mt-4">
                <GoogleLoginButton />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
