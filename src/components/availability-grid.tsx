"use client";

import { PointerEvent, useMemo, useRef, useState } from "react";
import { applySelectionRange } from "@/lib/selection";
import { createSlotIso, formatTime } from "@/lib/date-time";
import type { SlotResult } from "@/types";

type Props = {
  dates: string[]; startMinute: number; endMinute: number; slotMinutes: number;
  selectedSlots: Set<string>; onChange: (next: Set<string>) => void;
  mode: "edit" | "results"; results?: Map<string, SlotResult>; onInspect?: (slot: string) => void;
};

export function AvailabilityGrid({ dates, startMinute, endMinute, slotMinutes, selectedSlots, onChange, mode, results = new Map(), onInspect }: Props) {
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const activeDate = dates[activeDateIndex] ?? dates[0]!;
  const rowMinutes = useMemo(() => { const values: number[] = []; for (let minute = startMinute; minute < endMinute; minute += slotMinutes) values.push(minute); return values; }, [startMinute, endMinute, slotMinutes]);
  const orderedKeys = useMemo(() => rowMinutes.map((minute) => createSlotIso(activeDate, minute)), [activeDate, rowMinutes]);
  const drag = useRef<{ start: number; action: "add" | "remove"; baseline: Set<string> } | null>(null);

  function indexFromTarget(target: EventTarget | null): number | null {
    const cell = (target as HTMLElement | null)?.closest<HTMLElement>("[data-slot-index]");
    const value = cell?.dataset.slotIndex;
    return value === undefined ? null : Number(value);
  }
  function move(index: number) {
    if (!drag.current) return;
    onChange(applySelectionRange(drag.current.baseline, orderedKeys, drag.current.start, index, drag.current.action));
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (mode !== "edit") return;
    const index = indexFromTarget(event.target); if (index === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: index, action: selectedSlots.has(orderedKeys[index]) ? "remove" : "add", baseline: new Set(selectedSlots) };
    move(index);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const index = indexFromTarget(element); if (index !== null) move(index);
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex min-h-14 items-center justify-between border-b px-2">
        <button type="button" aria-label="前の日" disabled={activeDateIndex === 0} onClick={() => setActiveDateIndex((index) => Math.max(0, index - 1))} className="min-h-11 min-w-11 rounded-full text-xl font-bold text-emerald-800 disabled:opacity-20">←</button>
        <div className="text-center">
          <p className="text-sm font-black">{new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${activeDate}T00:00:00+09:00`))}</p>
          {dates.length > 1 && <p className="text-xs text-slate-500">{activeDateIndex + 1} / {dates.length}日</p>}
        </div>
        <button type="button" aria-label="次の日" disabled={activeDateIndex === dates.length - 1} onClick={() => setActiveDateIndex((index) => Math.min(dates.length - 1, index + 1))} className="min-h-11 min-w-11 rounded-full text-xl font-bold text-emerald-800 disabled:opacity-20">→</button>
      </div>
      <div
        className="grid select-none"
        style={{ gridTemplateColumns: "4.25rem 1fr", touchAction: mode === "edit" ? "none" : "pan-y" }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
      >
        {rowMinutes.flatMap((minute, row) => [
          <div key={`time-${minute}`} className="flex min-h-9 items-center justify-center border-b bg-slate-50 text-xs font-bold text-slate-500">{formatTime(createSlotIso(activeDate, minute))}</div>,
          ...[activeDate].map(() => {
            const index = row; const key = orderedKeys[index]; const result = results.get(key);
            const selected = selectedSlots.has(key); const ratio = result?.totalCount ? result.availableCount / result.totalCount : 0;
            return <button type="button" key={key} data-slot-index={index} aria-pressed={selected} aria-label={`${activeDate} ${formatTime(key)} ${mode === "results" ? `${result?.availableCount ?? 0}/${result?.totalCount ?? 0}` : selected ? "選択済み" : "未選択"}`} onClick={() => mode === "results" && onInspect?.(key)} className="min-h-9 border-b border-l text-xs font-bold transition-colors" style={{ backgroundColor: mode === "edit" ? (selected ? "#059669" : "white") : ratio ? `rgba(5,150,105,${0.15 + ratio * 0.75})` : "white", color: mode === "edit" && selected || ratio > 0.55 ? "white" : "#334155" }}>{mode === "results" ? `${result?.availableCount ?? 0}/${result?.totalCount ?? 0}` : selected ? "✓" : ""}</button>;
          }),
        ])}
      </div>
    </div>
  );
}
