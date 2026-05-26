import { getTodayPrompt } from "@/lib/prompts/daily-prompt";
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

  const prompt = await getTodayPrompt();

  return NextResponse.json({
    id: prompt.id,
    promptDate: prompt.promptDate,
    promptText: prompt.promptText,
    createdAt: prompt.createdAt,
    source: prompt.source,
  });
}
