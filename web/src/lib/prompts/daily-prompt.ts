import { createClient } from "@/lib/supabase/server";
import { promptForDate } from "@/lib/prompts/local-365";
import { cache } from "react";

export type DailyPromptSource = "local" | "database";

export type DailyPrompt = {
  id: string | null;
  promptDate: string;
  promptText: string;
  createdAt: string;
  source: DailyPromptSource;
};

export function todayDateString(timeZone = "Asia/Tokyo"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function todayRangeIso(timeZone = "Asia/Tokyo"): { start: string; end: string; date: string } {
  const date = todayDateString(timeZone);
  const start = new Date(`${date}T00:00:00+09:00`).toISOString();
  const end = new Date(`${date}T23:59:59.999+09:00`).toISOString();
  return { start, end, date };
}

function dateFromCreatedAt(createdAt: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(createdAt));
}

function localPromptForDate(date: string): DailyPrompt {
  const text = promptForDate(date);
  return {
    id: null,
    promptDate: date,
    promptText: text,
    createdAt: new Date().toISOString(),
    source: "local",
  };
}

function mapRow(row: {
  id: string;
  prompt: string;
  created_at: string;
}): DailyPrompt {
  return {
    id: row.id,
    promptDate: dateFromCreatedAt(row.created_at),
    promptText: row.prompt,
    createdAt: row.created_at,
    source: "database",
  };
}

async function fetchTodayPrompt(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<DailyPrompt | null> {
  const { start, end } = todayRangeIso();

  const { data, error } = await supabase
    .from("daily_prompts")
    .select("id, prompt, created_at")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("fetchTodayPrompt:", error.message);
    return null;
  }

  if (data?.prompt) {
    return mapRow(data);
  }

  return null;
}

/**
 * 今日のお題を取得。
 * DB に今日の行があればそれを優先。なければアプリ内のお題（日付で決まる1つ）。
 */
export const getTodayPrompt = cache(async (): Promise<DailyPrompt> => {
  const { date } = todayRangeIso();
  const local = localPromptForDate(date);

  try {
    const supabase = await createClient();
    const existing = await fetchTodayPrompt(supabase);
    return existing ?? local;
  } catch {
    return local;
  }
});

export const getOrCreateTodayPrompt = getTodayPrompt;
