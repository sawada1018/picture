"use client";

import { useState } from "react";

export function FriendCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(code);
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-purple-50 p-5 text-center">
      <p className="text-xs font-bold tracking-wide text-rose-400 uppercase">
        あなたのフレンドコード
      </p>
      <p className="mt-2 font-mono text-3xl font-extrabold tracking-[0.25em] text-rose-600">
        {code}
      </p>
      <button
        type="button"
        onClick={copyCode}
        className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-rose-600 shadow-sm transition hover:bg-rose-50"
      >
        {copied ? "コピーした！" : "コードをコピー"}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        彼氏・彼女に送って、ペア機能（次のステップ）でつながります
      </p>
    </div>
  );
}
