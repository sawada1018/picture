"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Google 不要のかんたん開始（Supabase 匿名ログイン）
 */
export function GuestStartForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const displayName = name.trim() || "あなた";

    const { data, error: signInError } =
      await supabase.auth.signInAnonymously();

    if (signInError || !data.user) {
      setError(
        signInError?.message.includes("Anonymous")
          ? "Supabase で「匿名ログイン」を有効にしてください（Authentication → Providers → Anonymous sign-ins）"
          : signInError?.message ?? "開始に失敗しました"
      );
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { display_name: displayName, name: displayName },
    });

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleStart} className="space-y-4">
      <div>
        <label
          htmlFor="guest-name"
          className="mb-1.5 block text-xs font-bold text-slate-500"
        >
          ニックネーム（任意）
        </label>
        <input
          id="guest-name"
          type="text"
          maxLength={20}
          placeholder="例：ゆい"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-rose-100 px-4 py-3 text-slate-800 outline-none focus:border-rose-300"
          autoComplete="nickname"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4 text-base font-extrabold text-white shadow-md shadow-rose-200 transition hover:from-rose-600 disabled:opacity-60"
      >
        {loading ? "準備中…" : "💕 かんたんにはじめる"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Google アカウント不要。端末に保存されるので、
        <br />
        同じブラウザから再度開くと続きから使えます。
      </p>
    </form>
  );
}
