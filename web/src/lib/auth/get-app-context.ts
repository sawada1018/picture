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
    };

export const getAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
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
