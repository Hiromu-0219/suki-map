"use client";

import { PointerEvent, useMemo, useRef } from "react";
import { applySelectionRange } from "@/lib/selection";
import { createSlotIso, formatTime } from "@/lib/date-time";
import type { SlotResult } from "@/types";

type Props = {
  dates: string[]; startMinute: number; endMinute: number; slotMinutes: number;
  selectedSlots: Set<string>; onChange: (next: Set<string>) => void;
  mode: "edit" | "results"; results?: Map<string, SlotResult>; onInspect?: (slot: string) => void;
};

export function AvailabilityGrid({ dates, startMinute, endMinute, slotMinutes, selectedSlots, onChange, mode, results = new Map(), onInspect }: Props) {
  const rowMinutes = useMemo(() => { const values: number[] = []; for (let minute = startMinute; minute < endMinute; minute += slotMinutes) values.push(minute); return values; }, [startMinute, endMinute, slotMinutes]);
  const orderedKeys = useMemo(() => rowMinutes.flatMap((minute) => dates.map((date) => createSlotIso(date, minute))), [dates, rowMinutes]);
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="grid min-w-max" style={{ gridTemplateColumns: `4.5rem repeat(${dates.length}, minmax(5rem, 1fr))` }}>
        <div className="sticky left-0 z-20 bg-white" />
        {dates.map((date) => <div key={date} className="border-b border-l p-3 text-center text-sm font-bold">{new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(new Date(`${date}T00:00:00+09:00`))}</div>)}
      </div>
      <div
        className="grid min-w-max select-none"
        style={{ gridTemplateColumns: `4.5rem repeat(${dates.length}, minmax(5rem, 1fr))`, touchAction: mode === "edit" ? "none" : "pan-y pan-x" }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
      >
        {rowMinutes.flatMap((minute, row) => [
          <div key={`time-${minute}`} className="sticky left-0 z-10 flex min-h-11 items-center justify-center border-b bg-white text-xs text-slate-500">{formatTime(createSlotIso(dates[0], minute))}</div>,
          ...dates.map((date, column) => {
            const index = row * dates.length + column; const key = orderedKeys[index]; const result = results.get(key);
            const selected = selectedSlots.has(key); const ratio = result?.totalCount ? result.availableCount / result.totalCount : 0;
            return <button type="button" key={key} data-slot-index={index} aria-pressed={selected} aria-label={`${date} ${formatTime(key)} ${mode === "results" ? `${result?.availableCount ?? 0}/${result?.totalCount ?? 0}` : selected ? "選択済み" : "未選択"}`} onClick={() => mode === "results" && onInspect?.(key)} className="min-h-11 border-b border-l text-xs font-bold transition-colors" style={{ backgroundColor: mode === "edit" ? (selected ? "#059669" : "white") : ratio ? `rgba(5,150,105,${0.15 + ratio * 0.75})` : "white", color: mode === "edit" && selected || ratio > 0.55 ? "white" : "#334155" }}>{mode === "results" ? `${result?.availableCount ?? 0}/${result?.totalCount ?? 0}` : ""}</button>;
          }),
        ])}
      </div>
    </div>
  );
}
