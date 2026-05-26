"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FriendCodeCard } from "@/components/home/friend-code-card";

type Props = {
  myFriendCode: string;
  paired: boolean;
  partnerName?: string | null;
  partnerCode?: string | null;
};

export function PairSection({
  myFriendCode,
  paired,
  partnerName,
  partnerCode,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendCode: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ペアになれませんでした");

      setSuccess(`${data.partner?.displayName ?? "相手"} とペア成立 💑`);
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <FriendCodeCard code={myFriendCode} />

      {paired ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5 text-center">
          <p className="text-xs font-bold text-rose-400">ペア中 💑</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">
            {partnerName ?? "相手"}
          </p>
          {partnerCode && (
            <p className="mt-1 font-mono text-xs text-slate-500">
              コード: {partnerCode}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-md shadow-rose-100/30">
          <h3 className="text-base font-extrabold text-slate-800">
            友達になる
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            彼・彼女のフレンドコードを入力してペアになりましょう
          </p>

          <form onSubmit={handlePair} className="mt-4 space-y-3">
            <input
              type="text"
              maxLength={6}
              placeholder="6文字のコード"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border-2 border-rose-100 px-4 py-3 text-center font-mono text-lg tracking-widest uppercase outline-none focus:border-rose-300"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-2xl bg-rose-500 py-3 text-sm font-extrabold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "接続中…" : "ペアになる"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-center text-xs text-red-600">{error}</p>
          )}
          {success && (
            <p className="mt-3 text-center text-xs font-bold text-rose-600">
              {success}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
