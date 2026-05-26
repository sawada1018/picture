import { createClient } from "@/lib/supabase/server";
import { getPartnerProfile, type PairInfo } from "@/lib/pairs";
import { ensureUserProfile } from "@/lib/users";
import type { User } from "@/types/database";
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

export async function getAppContext(): Promise<AppContext> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { user: profile, errorMessage, needsSchemaFix } =
    await ensureUserProfile(supabase, authUser);

  if (!profile) {
    return {
      ok: false,
      errorMessage:
        errorMessage ??
        "Supabase で users テーブルを作成したか確認してください。",
      needsSchemaFix,
    };
  }

  const pairInfo = await getPartnerProfile(supabase, authUser.id);

  return { ok: true, profile, pairInfo };
}
