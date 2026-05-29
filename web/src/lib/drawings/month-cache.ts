type MonthPayload = {
  drawings: Array<{
    userId: string;
    ownerName: string;
    isMine: boolean;
    questionDate: string;
    imageUrl: string;
    updatedAt: string | null;
  }>;
};

const cache = new Map<string, MonthPayload>();
const inflight = new Map<string, Promise<MonthPayload>>();

function cacheKey(year: number, month: number) {
  return `${year}-${month}`;
}

export function invalidateMonthCache(year?: number, month?: number) {
  if (year != null && month != null) {
    const key = cacheKey(year, month);
    cache.delete(key);
    inflight.delete(key);
    return;
  }
  cache.clear();
  inflight.clear();
}

export async function fetchMonthDrawings(
  year: number,
  month: number
): Promise<MonthPayload> {
  const key = cacheKey(year, month);
  const hit = cache.get(key);
  if (hit) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetch(`/api/drawings?year=${year}&month=${month}`)
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "読み込みに失敗しました");
      }
      const payload = data as MonthPayload;
      cache.set(key, payload);
      inflight.delete(key);
      return payload;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, request);
  return request;
}
