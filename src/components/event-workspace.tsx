"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AvailabilityGrid } from "@/components/availability-grid";
import { enumerateDates, formatDateTime } from "@/lib/date-time";
import { rankRecommendations } from "@/lib/recommendations";
import type { EventSummary, ParticipantSummary, SlotResult } from "@/types";

type Data = { event: EventSummary; participants: ParticipantSummary[]; results: SlotResult[] };
type Identity = { id: string; displayName: string; editToken: string };
type SaveState = "idle" | "saving" | "saved" | "error";

export function EventWorkspace({ initialData }: { initialData: Data }) {
  const { publicId } = initialData.event;
  const [data, setData] = useState(initialData);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"edit" | "results">("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [inspected, setInspected] = useState<string | null>(null);
  const dates = useMemo(() => enumerateDates(data.event.startDate, data.event.endDate), [data.event]);
  const resultMap = useMemo(() => new Map(data.results.map((result) => [result.startsAt, result])), [data.results]);
  const recommendations = useMemo(() => rankRecommendations(data.results, data.event.slotMinutes, data.event.requiredDurationMin), [data]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/events/${publicId}`, { cache: "no-store" });
    if (response.ok) setData(await response.json() as Data);
  }, [publicId]);
  useEffect(() => {
    const stored = localStorage.getItem(`sukimap:participant:${publicId}`);
    if (stored) {
      const restored = JSON.parse(stored) as Identity; setIdentity(restored);
      fetch(`/api/events/${publicId}/participants/${restored.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editToken: restored.editToken }) })
        .then(async (response) => { if (response.ok) { const value = await response.json() as { startsAtList: string[] }; setSelected(new Set(value.startsAtList)); } });
    }
    const timer = window.setInterval(() => { void refresh(); }, 15000);
    return () => window.clearInterval(timer);
  }, [publicId, refresh]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const displayName = String(new FormData(event.currentTarget).get("displayName") ?? "");
    const response = await fetch(`/api/events/${publicId}/participants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName }) });
    const body = await response.json() as Identity & { error?: string };
    if (!response.ok) return setError(body.error ?? "登録できませんでした");
    const next = { id: body.id, displayName: body.displayName, editToken: body.editToken };
    localStorage.setItem(`sukimap:participant:${publicId}`, JSON.stringify(next)); setIdentity(next); await refresh();
  }
  async function save() {
    if (!identity) return;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/events/${publicId}/availability`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantId: identity.id, editToken: identity.editToken, startsAtList: [...selected] }) });
      if (!response.ok) throw new Error();
      setSaveState("saved"); await refresh(); window.setTimeout(() => setSaveState("idle"), 2200);
    } catch { setSaveState("error"); }
  }
  async function confirm(startsAt: string, endsAt: string) {
    const organizerToken = localStorage.getItem(`sukimap:organizer:${publicId}`);
    if (!organizerToken) return setError("この端末には幹事トークンがありません");
    const response = await fetch(`/api/events/${publicId}/confirm`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizerToken, startsAt, endsAt }) });
    if (!response.ok) { const body = await response.json() as { error: string }; return setError(body.error); }
    await refresh();
  }
  async function share() {
    if (navigator.share) await navigator.share({ title: data.event.title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
  }
  const detail = inspected ? resultMap.get(inspected) : undefined;
  const available = new Set(detail?.availableIds ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {data.event.confirmedStartAt && <div className="mb-5 rounded-2xl bg-amber-100 p-4 font-black text-amber-950">開催日時：{formatDateTime(data.event.confirmedStartAt)}〜{data.event.confirmedEndAt ? formatDateTime(data.event.confirmedEndAt).split(" ")[1] : ""}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-emerald-700">日程調整</p><h1 className="text-3xl font-black">{data.event.title}</h1>{data.event.description && <p className="mt-2 whitespace-pre-wrap text-slate-600">{data.event.description}</p>}</div>
        <button onClick={share} className="rounded-full border border-emerald-700 px-4 py-2 font-bold text-emerald-800">共有する</button>
      </div>
      {!identity ? (
        <form onSubmit={join} className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-6 ring-1 ring-emerald-100">
          <h2 className="text-xl font-black">あなたの名前</h2><p className="mt-1 text-sm text-slate-600">登録やメールアドレスは不要です。</p>
          <input name="displayName" required maxLength={40} className="mt-5 min-h-12 w-full rounded-xl border border-slate-300 px-4" placeholder="すきま 太郎" />
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
          <button className="mt-4 min-h-12 w-full rounded-full bg-emerald-700 font-bold text-white">空き時間を入力する</button>
        </form>
      ) : (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3"><p><b>{identity.displayName}</b> さん</p><div className="flex rounded-full bg-slate-200 p-1"><button onClick={() => setMode("edit")} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "edit" ? "bg-white text-emerald-800" : ""}`}>予定を塗る</button><button onClick={() => setMode("results")} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "results" ? "bg-white text-emerald-800" : ""}`}>結果を見る</button></div></div>
          <p className="mb-3 text-sm text-slate-600">{mode === "edit" ? "指やマウスでなぞって選択・解除できます。" : "セルをタップすると参加状況を確認できます。"}</p>
          <AvailabilityGrid dates={dates} startMinute={data.event.dailyStartMinute} endMinute={data.event.dailyEndMinute} slotMinutes={data.event.slotMinutes} selectedSlots={selected} onChange={setSelected} mode={mode} results={resultMap} onInspect={setInspected} />
          {mode === "edit" && <div className="sticky bottom-3 mt-4 flex items-center justify-between rounded-2xl bg-emerald-950 p-3 text-white"><span className="text-sm">{saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存しました ✓" : saveState === "error" ? "保存に失敗しました" : `${selected.size}枠を選択中`}</span><button onClick={save} disabled={saveState === "saving"} className="rounded-full bg-white px-5 py-2 font-bold text-emerald-900">{saveState === "error" ? "再試行" : "回答を保存"}</button></div>}
          {mode === "results" && <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-emerald-100"><h2 className="text-xl font-black">おすすめ時間帯</h2><div className="mt-4 space-y-3">{recommendations.length ? recommendations.map((item) => <div key={item.startsAt} className="rounded-2xl bg-emerald-50 p-4"><b>{formatDateTime(item.startsAt)}〜{new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }).format(new Date(item.endsAt))}</b><p className="text-sm">{item.availableCount}/{item.totalCount}人が参加可能</p><button onClick={() => void confirm(item.startsAt, item.endsAt)} className="mt-2 text-sm font-bold text-emerald-800 underline">この時間に確定</button></div>) : <p className="text-slate-500">回答が集まると表示されます。</p>}</div></div>
            <div className="rounded-3xl bg-white p-5 ring-1 ring-emerald-100"><h2 className="text-xl font-black">参加者 {data.participants.length}人</h2><ul className="mt-3 space-y-2">{data.participants.map((person) => <li key={person.id} className="flex justify-between"><span>{person.displayName}</span><span className={person.answered ? "text-emerald-700" : "text-slate-400"}>{person.answered ? "回答済み" : "未回答"}</span></li>)}</ul></div>
          </section>}
        </div>
      )}
      {inspected && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end bg-black/30 md:items-center md:justify-center" onClick={() => setInspected(null)}><div className="max-h-[75vh] w-full overflow-auto rounded-t-3xl bg-white p-6 md:max-w-md md:rounded-3xl" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><h2 className="text-xl font-black">{formatDateTime(inspected)}</h2><button onClick={() => setInspected(null)} aria-label="閉じる">✕</button></div><h3 className="mt-5 font-bold text-emerald-700">参加可能</h3><p>{data.participants.filter((person) => available.has(person.id)).map((person) => person.displayName).join("、") || "なし"}</p><h3 className="mt-4 font-bold text-red-700">参加できない・未回答</h3><p>{data.participants.filter((person) => !available.has(person.id)).map((person) => person.displayName).join("、") || "なし"}</p></div></div>}
    </div>
  );
}
