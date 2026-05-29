import { prefetchTodayDrawing } from "@/lib/drawings/today-cache";
import { fetchMonthDrawings } from "@/lib/drawings/month-cache";

function currentMonthInTokyo() {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m] = iso.split("-").map(Number);
  return { y, m };
}

/** お絵描きタブ用：キャンバス JS と今日の保存済み画像を先読み */
export function prefetchDrawPage() {
  void import("@/components/draw/drawing-canvas");
  void prefetchTodayDrawing();
}

/** アプリ起動後：記録タブ用に今月分も先読み */
export function prefetchCalendarMonth() {
  const { y, m } = currentMonthInTokyo();
  void fetchMonthDrawings(y, m);
}
