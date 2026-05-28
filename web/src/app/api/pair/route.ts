import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPairsTableMissingError,
  normalizePairUsers,
  PAIRS_SETUP_HINT,
} from "@/lib/pairs";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: pair, error: pairError } = await supabase
    .from("pairs")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();

  if (pairError) {
    if (isPairsTableMissingError(pairError)) {
      return NextResponse.json({ error: PAIRS_SETUP_HINT }, { status: 503 });
    }
    return NextResponse.json({ error: pairError.message }, { status: 500 });
  }

  if (!pair) {
    return NextResponse.json({ paired: false, partner: null });
  }

  const partnerId = pair.user_a === user.id ? pair.user_b : pair.user_a;
  const { data: partner } = await supabase
    .from("users")
    .select("display_name, friend_code, avatar_url")
    .eq("id", partnerId)
    .single();

  return NextResponse.json({
    paired: true,
    partner: partner ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const friendCode = (body.friendCode as string | undefined)
    ?.trim()
    .toUpperCase();

  if (!friendCode || friendCode.length !== 6) {
    return NextResponse.json(
      { error: "6文字のフレンドコードを入力してください" },
      { status: 400 }
    );
  }

  const { data: existingPair, error: existingPairError } = await supabase
    .from("pairs")
    .select("id")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();

  if (existingPairError) {
    if (isPairsTableMissingError(existingPairError)) {
      return NextResponse.json({ error: PAIRS_SETUP_HINT }, { status: 503 });
    }
    return NextResponse.json({ error: existingPairError.message }, { status: 500 });
  }

  if (existingPair) {
    return NextResponse.json(
      { error: "すでにペアになっています" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "サーバー設定が不足しています" },
      { status: 500 }
    );
  }

  const { data: partner, error: partnerError } = await admin
    .from("users")
    .select("id, display_name, friend_code")
    .eq("friend_code", friendCode)
    .maybeSingle();

  if (partnerError || !partner) {
    return NextResponse.json(
      { error: "フレンドコードが見つかりません" },
      { status: 404 }
    );
  }

  if (partner.id === user.id) {
    return NextResponse.json(
      { error: "自分のコードは入力できません" },
      { status: 400 }
    );
  }

  const { data: partnerPair, error: partnerPairError } = await admin
    .from("pairs")
    .select("id")
    .or(`user_a.eq.${partner.id},user_b.eq.${partner.id}`)
    .maybeSingle();

  if (partnerPairError) {
    if (isPairsTableMissingError(partnerPairError)) {
      return NextResponse.json({ error: PAIRS_SETUP_HINT }, { status: 503 });
    }
    return NextResponse.json({ error: partnerPairError.message }, { status: 500 });
  }

  if (partnerPair) {
    return NextResponse.json(
      { error: "相手はすでに別の人とペアになっています" },
      { status: 400 }
    );
  }

  const [userA, userB] = normalizePairUsers(user.id, partner.id);

  const { error: insertError } = await supabase.from("pairs").insert({
    user_a: userA,
    user_b: userB,
  });

  if (insertError) {
    if (isPairsTableMissingError(insertError)) {
      return NextResponse.json({ error: PAIRS_SETUP_HINT }, { status: 503 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    paired: true,
    partner: {
      displayName: partner.display_name,
      friendCode: partner.friend_code,
    },
  });
}
