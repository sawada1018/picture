"use client";

import { getAuthCallbackUrl } from "@/lib/auth/get-auth-callback-url";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Mode = "signin" | "signup";

export function EmailPasswordForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(
    () => (mode === "signin" ? "メールでログイン" : "新規登録する"),
    [mode]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const cleanedEmail = email.trim();

    if (!cleanedEmail || password.length < 6) {
      setError("メールアドレスと6文字以上のパスワードを入力してください。");
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const callbackUrl = getAuthCallbackUrl();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanedEmail,
      password,
      options: { emailRedirectTo: callbackUrl },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "確認メールを送信しました。メール内リンクを開いてからログインしてください。届かない場合は迷惑メールを確認してください。"
    );
    setLoading(false);
  }

  async function handleResetPassword() {
    setError(null);
    setMessage(null);
    const cleanedEmail = email.trim();
    if (!cleanedEmail) {
      setError("パスワード再設定にはメールアドレス入力が必要です。");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      cleanedEmail,
      {
        redirectTo: getAuthCallbackUrl(),
      }
    );
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }
    setMessage("再設定メールを送信しました。メールをご確認ください。");
    setLoading(false);
  }

  return (
    <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">メールアドレスで続ける</p>
        <div className="inline-flex rounded-lg bg-white p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded px-2 py-1 font-bold ${
              mode === "signin" ? "bg-rose-500 text-white" : "text-slate-500"
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded px-2 py-1 font-bold ${
              mode === "signup" ? "bg-rose-500 text-white" : "text-slate-500"
            }`}
          >
            新規登録
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          autoComplete="email"
          className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm outline-none focus:border-rose-300"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード（6文字以上）"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm outline-none focus:border-rose-300"
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-2 py-2 text-xs text-red-600">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-2 py-2 text-xs text-emerald-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-rose-600 shadow-sm transition hover:bg-rose-100 disabled:opacity-60"
        >
          {loading ? "処理中…" : submitLabel}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResetPassword}
        disabled={loading}
        className="mt-2 text-xs font-bold text-slate-400 underline-offset-2 hover:text-rose-500 hover:underline disabled:opacity-60"
      >
        パスワードを忘れた場合
      </button>
    </div>
  );
}
