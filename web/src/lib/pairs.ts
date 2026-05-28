import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, User } from "@/types/database";

const PAIRS_TABLE_MISSING_PATTERN = /could not find the table 'public\.pairs'/i;

export type PairInfo = {
  pairId: string;
  partner: Pick<User, "id" | "display_name" | "friend_code" | "avatar_url">;
};

export const PAIRS_SETUP_HINT =
  "pairs テーブルが未作成です。Supabase SQL Editor で web/supabase/migrations/005_pairs_and_anonymous.sql を実行してください。";

export function isPairsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message ?? "") : "";
  const code = "code" in error ? String(error.code ?? "") : "";
  return code === "PGRST205" || PAIRS_TABLE_MISSING_PATTERN.test(message);
}

export async function getPairForUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("pairs")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function getPartnerProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PairInfo | null> {
  const pair = await getPairForUser(supabase, userId);
  if (!pair) return null;

  const partnerId = pair.user_a === userId ? pair.user_b : pair.user_a;
  const { data: partner } = await supabase
    .from("users")
    .select("id, display_name, friend_code, avatar_url")
    .eq("id", partnerId)
    .single();

  if (!partner) return null;

  return {
    pairId: pair.id,
    partner,
  };
}

export function normalizePairUsers(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}
