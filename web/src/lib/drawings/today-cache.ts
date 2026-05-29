type TodayPayload = {
  imageUrl: string | null;
  questionDate: string;
  updatedAt: string | null;
};

let cached: TodayPayload | null = null;
let inflight: Promise<TodayPayload> | null = null;

export function invalidateTodayCache() {
  cached = null;
  inflight = null;
}

export function prefetchTodayDrawing(): Promise<TodayPayload> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetch("/api/drawings", { cache: "no-store" })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "読み込みに失敗");
      }
      const payload: TodayPayload = {
        imageUrl: data.imageUrl ?? null,
        questionDate: data.questionDate,
        updatedAt: data.updatedAt ?? null,
      };
      cached = payload;
      inflight = null;
      return payload;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

export async function getTodayDrawing(): Promise<TodayPayload> {
  if (cached) return cached;
  return prefetchTodayDrawing();
}
