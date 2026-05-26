import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, User } from "@/types/database";

export type PairInfo = {
  pairId: string;
  partner: Pick<User, "id" | "display_name" | "friend_code" | "avatar_url">;
};

export async function getPairForUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data } = await supabase
    .from("pairs")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

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
