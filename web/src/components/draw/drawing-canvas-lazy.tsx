"use client";

import dynamic from "next/dynamic";

export const DrawingCanvasLazy = dynamic(
  () =>
    import("@/components/draw/drawing-canvas").then((m) => ({
      default: m.DrawingCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-rose-50 bg-white text-sm text-slate-400">
        お絵描きを読み込み中…
      </div>
    ),
  }
);
