"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DRAW_PALETTE,
  useDrawingCanvas,
} from "@/hooks/use-drawing-canvas";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const {
    color,
    setColor,
    brushSize,
    setBrushSize,
    tool,
    setPen,
    setEraser,
    clearCanvas,
    undo,
    canUndo,
    exportDataUrl,
    loadFromDataUrl,
    isBlank,
    ready,
  } = useDrawingCanvas(canvasRef);

  const loadTodayDrawing = useCallback(async () => {
    try {
      const res = await fetch("/api/drawings");
      if (!res.ok) return;
      const data = await res.json();
      const src = data.imageUrl ?? data.imageData;
      if (src) {
        loadFromDataUrl(src);
      }
    } catch {
      /* 初回などは無視 */
    }
  }, [loadFromDataUrl]);

  useEffect(() => {
    if (ready) loadTodayDrawing();
  }, [ready, loadTodayDrawing]);

  const handleSave = async () => {
    if (isBlank()) {
      setSaveStatus("error");
      setSaveMessage("何か描いてから保存してね");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: exportDataUrl() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");

      setSaveStatus("saved");
      setSaveMessage("保存しました ✨");
      window.dispatchEvent(new Event("drawing-saved"));
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(
        err instanceof Error ? err.message : "保存に失敗しました"
      );
    }
  };

  const handleClear = () => {
    if (window.confirm("キャンバスを白紙に戻しますか？")) {
      clearCanvas();
      setSaveStatus("idle");
      setSaveMessage("");
    }
  };

  return (
    <section className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-lg shadow-rose-100/30 sm:p-5">
      <h2 className="text-lg font-extrabold text-slate-800">お絵描き</h2>
      <p className="mt-1 text-xs text-slate-500">
        ペン・消しゴム・一つ戻るで描いて保存
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-rose-50 bg-white">
        <canvas
          ref={canvasRef}
          className="block aspect-square w-full touch-none cursor-crosshair"
          aria-label="お絵描きキャンバス"
        />
      </div>

      <div className="mt-4 space-y-3">
        {/* ツール: ペン / 消しゴム / 一つ戻る / クリア */}
        <div className="flex flex-wrap gap-2">
          <ToolButton
            active={tool === "pen"}
            onClick={() => {
              setPen();
            }}
            label="ペン"
          >
            ✏️ ペン
          </ToolButton>
          <ToolButton
            active={tool === "eraser"}
            onClick={setEraser}
            label="消しゴム"
          >
            🧽 消しゴム
          </ToolButton>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="一つ戻る"
            className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↩ 一つ戻る
          </button>
          <button
            type="button"
            onClick={handleClear}
            aria-label="クリア"
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
          >
            クリア
          </button>
        </div>

        {/* 色 */}
        <div>
          <p className="mb-2 text-xs font-bold text-slate-400">色</p>
          <div className="flex flex-wrap gap-2">
            {DRAW_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`色 ${c}`}
                onClick={() => {
                  setColor(c);
                  setPen();
                }}
                className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                  color === c && tool === "pen"
                    ? "border-slate-800 scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* 線の太さ */}
        <div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span>線の太さ</span>
            <span className="tabular-nums text-rose-500">{brushSize}px</span>
            <input
              type="range"
              min={2}
              max={40}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-rose-500"
            />
          </label>
        </div>

        {/* 保存 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-rose-200 transition hover:from-rose-600 hover:to-rose-700 disabled:opacity-60"
        >
          {saveStatus === "saving" ? "保存中…" : "💾 保存する"}
        </button>

        {saveMessage && (
          <p
            className={`text-center text-sm font-medium ${
              saveStatus === "error" ? "text-red-600" : "text-rose-500"
            }`}
            role="status"
          >
            {saveMessage}
          </p>
        )}
      </div>
    </section>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-rose-500 text-white shadow-md shadow-rose-200"
          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
      }`}
    >
      {children}
    </button>
  );
}
