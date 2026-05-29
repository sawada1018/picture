import { EmailPasswordForm } from "@/components/auth/email-password-form";
import { GuestStartForm } from "@/components/auth/guest-start-form";
import {
  getRequiredEnvChecklist,
  getVercelDeployNote,
  supabaseEnvSetupHint,
} from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const envChecks = error === "config" ? getRequiredEnvChecklist() : null;
  const vercelNote = error === "config" ? getVercelDeployNote() : null;
  const healthPath = "/api/health";

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
            メールで登録して、友達コードで二人につながる。
          </p>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-xl shadow-rose-100/40 backdrop-blur">
          {error === "config" && (
            <div
              className="mb-4 rounded-xl bg-amber-50 px-3 py-3 text-left text-xs text-amber-900"
              role="alert"
            >
              <p className="font-bold">Supabase の設定が不足しています</p>
              <ul className="mt-2 space-y-2">
                {envChecks?.map((item) => (
                  <li key={item.name} className="leading-snug">
                    <span
                      className={
                        item.ok ? "text-emerald-700" : "font-semibold text-amber-950"
                      }
                    >
                      {item.ok ? "✓" : "✗"} {item.name}
                    </span>
                    {!item.ok && item.hint ? (
                      <span className="mt-0.5 block text-[11px] text-amber-800/90">
                        → {item.hint}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {vercelNote ? (
                <p className="mt-2 rounded-lg bg-amber-100/80 px-2 py-1.5 text-[11px] font-medium leading-relaxed text-amber-950">
                  {vercelNote}
                </p>
              ) : null}
              <p className="mt-2 leading-relaxed">{supabaseEnvSetupHint()}</p>
              <p className="mt-1 text-[11px] text-amber-800/80">
                診断:{" "}
                <a href={healthPath} className="underline">
                  {healthPath}
                </a>
                ・詳細: web/docs/VERCEL-DEPLOY.md
              </p>
            </div>
          )}
          {error === "auth" && (
            <p
              className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600"
              role="alert"
            >
              メール確認リンクの有効期限切れ、または Supabase の Redirect URL
              未設定の可能性があります。
            </p>
          )}

          {error !== "config" && <EmailPasswordForm />}

          {error !== "config" && (
            <details className="mt-6 group">
              <summary className="cursor-pointer text-center text-xs font-bold text-slate-400 hover:text-rose-500">
                かんたん開始（Google 不要・端末に保存）
              </summary>
              <div className="mt-4">
                <GuestStartForm />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
