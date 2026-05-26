import { DrawingCanvas } from "@/components/draw/drawing-canvas";
import { DailyPromptCard } from "@/components/home/daily-prompt-card";
import { getTodayPrompt } from "@/lib/prompts/daily-prompt";

export default async function DrawPage() {
  const dailyPrompt = await getTodayPrompt();

  return (
    <div className="space-y-6">
      <DailyPromptCard prompt={dailyPrompt} />
      <DrawingCanvas />
    </div>
  );
}
