import { createClient } from "@/lib/supabase/server";
import { getPartnerProfile, type PairInfo } from "@/lib/pairs";
import { ensureUserProfile } from "@/lib/users";
import type { User } from "@/types/database";
import { cache } from "react";
import { redirect } from "next/navigation";

export type AppContext =
  | {
      ok: true;
      profile: User;
      pairInfo: PairInfo | null;
    }
  | {
      ok: false;
      errorMessage: string;
      needsSchemaFix?: boolean;
      unauthorized?: boolean;
    };

/** API / クライアント用（redirect しない） */
export const fetchAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      ok: false,
      errorMessage: "ログインが必要です",
      unauthorized: true,
    };
  }

  const [{ user: profile, errorMessage, needsSchemaFix }, pairInfo] =
    await Promise.all([
      ensureUserProfile(supabase, authUser),
      getPartnerProfile(supabase, authUser.id),
    ]);

  if (!profile) {
    return {
      ok: false,
      errorMessage:
        errorMessage ??
        "Supabase で users テーブルを作成したか確認してください。",
      needsSchemaFix,
    };
  }

  return { ok: true, profile, pairInfo };
});

/** サーバーコンポーネント用 */
export const getAppContext = cache(async (): Promise<AppContext> => {
  const ctx = await fetchAppContext();
  if (!ctx.ok && ctx.unauthorized) {
    redirect("/login");
  }
  return ctx;
});
