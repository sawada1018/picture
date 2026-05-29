import type { DailyPrompt } from "@/lib/prompts/daily-prompt";

const SOURCE_LABEL: Record<DailyPrompt["source"], string> = {
  local: "今日のお題",
  database: "今日のお題",
};

export function DailyPromptCard({ prompt }: { prompt: DailyPrompt }) {
  return (
    <section className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-lg shadow-rose-100/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-violet-500" aria-hidden />
        <span className="text-xs font-bold text-violet-600">
          {SOURCE_LABEL[prompt.source]}
        </span>
        <time
          dateTime={prompt.promptDate}
          className="ml-auto text-xs text-slate-400"
        >
          {prompt.promptDate}
        </time>
      </div>
      <p className="text-lg font-extrabold leading-relaxed text-slate-800">
        {prompt.promptText}
      </p>
      {prompt.source === "local" && (
        <p className="mt-3 text-[10px] text-violet-400">
          アプリ内のお題を表示しています（OpenAI 不要）
        </p>
      )}
    </section>
  );
}
