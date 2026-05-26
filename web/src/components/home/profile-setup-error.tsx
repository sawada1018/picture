import Link from "next/link";
import { SCHEMA_FIX_HINT } from "@/lib/users";

export function ProfileSetupError({
  message,
  needsSchemaFix,
}: {
  message: string;
  needsSchemaFix?: boolean;
}) {
  const showColumnFix = needsSchemaFix ?? message.includes("display_name");

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-6 text-left shadow-lg">
      <p className="text-lg font-extrabold text-amber-900">
        プロフィールの読み込みに失敗しました
      </p>

      {showColumnFix ? (
        <>
          <p className="mt-3 text-sm font-bold text-amber-900">
            users テーブルはあります。列の追加だけ必要です。
          </p>
          <p className="mt-2 text-sm text-amber-800">{SCHEMA_FIX_HINT}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-amber-900">
            <li>
              <a
                href="https://supabase.com/dashboard/project/tqsyejbdygachjgmkqnd/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-rose-600 underline"
              >
                Supabase SQL Editor
              </a>
              を開く
            </li>
            <li>
              <code className="rounded bg-white px-1 text-xs">
                web/supabase/FIX_NOW.sql
              </code>{" "}
              の全文を貼り付け → <strong>Run</strong>
            </li>
            <li>
              <strong>SETUP_ALL.sql は実行しない</strong>（既に users があるため）
            </li>
            <li>Authentication → Anonymous sign-ins → ON</li>
            <li>F5 で再読み込み</li>
          </ol>
        </>
      ) : (
        <p className="mt-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Link
          href="/"
          className="rounded-xl bg-rose-500 py-3 text-center text-sm font-bold text-white"
        >
          再読み込み
        </Link>
        <Link
          href="/api/health"
          className="rounded-xl border border-amber-200 bg-white py-2 text-center text-xs font-bold text-amber-800"
        >
          診断 (/api/health)
        </Link>
      </div>
    </div>
  );
}
