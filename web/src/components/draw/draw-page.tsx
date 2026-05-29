"use client";

import { DrawingCanvas } from "@/components/draw/drawing-canvas";
import { DailyPromptCard } from "@/components/home/daily-prompt-card";
import { prefetchDrawPage } from "@/lib/drawings/prefetch";
import { promptForDate } from "@/lib/prompts/local-365";
import type { DailyPrompt } from "@/lib/prompts/daily-prompt";
import { useEffect, useMemo } from "react";

function todayIsoInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function DrawPage() {
  useEffect(() => {
    prefetchDrawPage();
  }, []);

  const dailyPrompt = useMemo((): DailyPrompt => {
    const promptDate = todayIsoInTokyo();
    return {
      id: null,
      promptDate,
      promptText: promptForDate(promptDate),
      createdAt: new Date().toISOString(),
      source: "local",
    };
  }, []);

  return (
    <div className="space-y-6">
      <DailyPromptCard prompt={dailyPrompt} />
      <DrawingCanvas />
    </div>
  );
}
