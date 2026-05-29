import { fetchAppContext } from "@/lib/auth/get-app-context";
import { NextResponse } from "next/server";

/** プロフィール + ペア情報（タブ切り替え用・1回取得） */
export async function GET() {
  const ctx = await fetchAppContext();
  if (!ctx.ok && ctx.unauthorized) {
    return NextResponse.json(ctx, { status: 401 });
  }
  return NextResponse.json(ctx, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
