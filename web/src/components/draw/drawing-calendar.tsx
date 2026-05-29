"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DrawingEntry } from "@/components/draw/drawing-types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function todayInTokyo(): { y: number; m: number; d: number; iso: string } {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, iso };
}

function buildCalendarCells(year: number, month: number) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function toDateIso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function DrawingCalendar() {
  const today = todayInTokyo();
  const [viewYear, setViewYear] = useState(today.y);
  const [viewMonth, setViewMonth] = useState(today.m);
  const [byDate, setByDate] = useState<Map<string, CalendarDrawingEntry[]>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(today.iso);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/drawings?year=${viewYear}&month=${viewMonth}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "読み込みに失敗しました");

      const map = new Map<string, CalendarDrawingEntry[]>();
      for (const row of data.drawings as CalendarDrawingEntry[]) {
        if (!row.imageUrl) continue;
        const existing = map.get(row.questionDate) ?? [];
        existing.push(row);
        map.set(row.questionDate, existing);
      }
      setByDate(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      setByDate(new Map());
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  useEffect(() => {
    const onSaved = () => fetchMonth();
    window.addEventListener("drawing-saved", onSaved);
    return () => window.removeEventListener("drawing-saved", onSaved);
  }, [fetchMonth]);

  const cells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const selected = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <section className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-lg shadow-rose-100/30 sm:p-5">
      <h2 className="text-lg font-extrabold text-slate-800">これまでの絵</h2>
      <p className="mt-1 text-xs text-slate-500">
        日付をタップすると、その日に保存した絵が表示されます（1日1枚）
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100"
          aria-label="前の月"
        >
          ‹
        </button>
        <p className="text-sm font-extrabold text-slate-700">
          {viewYear}年 {viewMonth}月
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-center text-sm text-slate-400">読み込み中…</p>
      ) : error ? (
        <p className="mt-6 text-center text-sm text-red-600">{error}</p>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const iso = toDateIso(viewYear, viewMonth, day);
            const entries = byDate.get(iso) ?? [];
            const hasDrawing = entries.length > 0;
            const isToday = iso === today.iso;
            const isSelected = iso === selectedDate;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold transition ${
                  isSelected
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : isToday
                      ? "bg-rose-100 text-rose-700 ring-2 ring-rose-300"
                      : hasDrawing
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "text-slate-600 hover:bg-slate-50"
                }`}
                aria-label={`${iso}${hasDrawing ? " 保存あり" : ""}`}
              >
                {day}
                {hasDrawing && (
                  <span
                    className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-rose-500"
                    }`}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-rose-50 bg-rose-50/50 p-4">
        {selectedDate ? (
          <>
            <p className="text-xs font-bold text-rose-500">{selectedDate}</p>
            {selected.length > 0 ? (
              <div className="mt-3 space-y-4">
                {selected.map((entry) => (
                  <div key={`${entry.userId}-${entry.questionDate}`} className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-slate-600">
                      {entry.isMine ? "あなた" : `ともだち（${entry.ownerName}）`}
                    </p>
                    <div className="mt-2 aspect-square w-full overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.imageUrl}
                        alt={`${selectedDate} のお絵描き（${entry.ownerName}）`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-center text-sm text-slate-500">
                この日はまだ保存された絵がありません
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-slate-500">
            カレンダーから日付を選んでください
          </p>
        )}
      </div>
    </section>
  );
}

type CalendarDrawingEntry = DrawingEntry & {
  userId: string;
  ownerName: string;
  isMine: boolean;
};
