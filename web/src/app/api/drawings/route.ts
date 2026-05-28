import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getPairForUser } from "@/lib/pairs";
import {
  BUCKET,
  dataUrlToBuffer,
  drawingStoragePath,
  getDrawingPublicUrl,
} from "@/lib/storage/drawings";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const dateParam = searchParams.get("date");
  const timelineParam = searchParams.get("timeline");

  if (timelineParam === "1") {
    const limitRaw = Number(searchParams.get("limit") ?? 120);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(1, limitRaw), 365)
      : 120;

    const { data, error } = await supabase
      .from("drawings")
      .select("question_date, image_url, updated_at")
      .eq("user_id", user.id)
      .order("question_date", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      drawings: (data ?? []).map((row) => ({
        questionDate: row.question_date,
        imageUrl: row.image_url,
        updatedAt: row.updated_at,
      })),
    });
  }

  if (yearParam && monthParam) {
    const year = Number(yearParam);
    const month = Number(monthParam);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "year / month が不正です" }, { status: 400 });
    }

    const mm = String(month).padStart(2, "0");
    const start = `${year}-${mm}-01`;
    const end = `${year}-${mm}-${String(lastDayOfMonth(year, month)).padStart(2, "0")}`;

    const pair = await getPairForUser(supabase, user.id);
    const visibleUserIds = pair
      ? [user.id, pair.user_a === user.id ? pair.user_b : pair.user_a]
      : [user.id];
    const readerClient = createAdminClient() ?? supabase;

    const { data, error } = await readerClient
      .from("drawings")
      .select("user_id, question_date, image_url, updated_at")
      .in("user_id", visibleUserIds)
      .gte("question_date", start)
      .lte("question_date", end)
      .order("question_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: users, error: usersError } = await readerClient
      .from("users")
      .select("id, display_name")
      .in("id", visibleUserIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name]));

    return NextResponse.json({
      year,
      month,
      drawings: (data ?? []).map((row) => ({
        userId: row.user_id,
        ownerName:
          nameById.get(row.user_id) ?? (row.user_id === user.id ? "あなた" : "ともだち"),
        isMine: row.user_id === user.id,
        questionDate: row.question_date,
        imageUrl: row.image_url,
        updatedAt: row.updated_at,
      })),
    });
  }

  const date = dateParam ?? todayDateString();
  const { data, error } = await supabase
    .from("drawings")
    .select("image_url, question_date, updated_at")
    .eq("user_id", user.id)
    .eq("question_date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imageUrl: data?.image_url ?? null,
    questionDate: date,
    updatedAt: data?.updated_at ?? null,
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

  const env = getSupabaseEnv();
  if (!env.ok) {
    return NextResponse.json(
      { error: "Supabase の環境変数が未設定です" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const imageData = body.imageData as string | undefined;

  if (!imageData?.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "画像データが不正です" },
      { status: 400 }
    );
  }

  const date = todayDateString();
  const storagePath = drawingStoragePath(user.id, date);

  let fileBuffer: Buffer;
  try {
    fileBuffer = dataUrlToBuffer(imageData);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "画像の変換に失敗しました" },
      { status: 400 }
    );
  }

  if (fileBuffer.length > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "画像が大きすぎます（5MB以下）" },
      { status: 400 }
    );
  }

  // 1. Supabase Storage にアップロード（パスは user.id で検証済み）
  const storageClient = createAdminClient() ?? supabase;
  const { error: uploadError } = await storageClient.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    const hint =
      uploadError.message.includes("Bucket not found")
        ? " Supabase の SQL Editor で web/supabase/STORAGE_NOW.sql を実行し、Storage に「drawings」バケットを作成してください。"
        : "";
    return NextResponse.json(
      { error: `Storage へのアップロードに失敗: ${uploadError.message}.${hint}` },
      { status: 500 }
    );
  }

  // 2. 公開 URL を取得して drawings テーブルに保存
  const imageUrl = getDrawingPublicUrl(env.url, storagePath);

  const row: Database["public"]["Tables"]["drawings"]["Insert"] = {
    user_id: user.id,
    question_date: date,
    image_url: imageUrl,
  };

  const { data, error: dbError } = await supabase
    .from("drawings")
    .upsert(row, { onConflict: "user_id,question_date" })
    .select("question_date, updated_at, image_url")
    .single();

  if (dbError) {
    const hint = /drawings/i.test(dbError.message)
      ? " Supabase SQL Editor で web/supabase/DRAWINGS_NOW.sql を実行してください。"
      : "";
    return NextResponse.json(
      { error: `${dbError.message}.${hint}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    imageUrl: data.image_url,
    questionDate: data.question_date,
    updatedAt: data.updated_at,
  });
}
