import { applySavedDrawingToMonth, type SavedDrawingEntry } from "@/lib/drawings/month-cache";

export const DRAWING_SAVED_EVENT = "drawing-saved";

export type DrawingSavedDetail = SavedDrawingEntry;

export function dispatchDrawingSaved(detail: DrawingSavedDetail) {
  window.dispatchEvent(
    new CustomEvent<DrawingSavedDetail>(DRAWING_SAVED_EVENT, { detail })
  );
}

export function parseDrawingSavedEvent(
  event: Event
): DrawingSavedDetail | null {
  if (!(event instanceof CustomEvent)) return null;
  const detail = event.detail as DrawingSavedDetail | undefined;
  if (!detail?.questionDate || !detail.imageUrl) return null;
  return detail;
}

export function notifyDrawingSaved(detail: DrawingSavedDetail) {
  applySavedDrawingToMonth(detail);
  dispatchDrawingSaved(detail);
}
