"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3";

export function EventForm() {
  const router = useRouter();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      title: form.get("title"), description: form.get("description"),
      startDate: form.get("startDate"), endDate: form.get("endDate"),
      dailyStartMinute: Number(form.get("startHour")) * 60,
      dailyEndMinute: Number(form.get("endHour")) * 60,
      slotMinutes: Number(form.get("slotMinutes")),
      requiredDurationMin: Number(form.get("requiredDurationMin")),
    };
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await response.json()) as { publicId?: string; organizerToken?: string; error?: string };
      if (!response.ok || !data.publicId || !data.organizerToken) throw new Error(data.error ?? "作成できませんでした");
      localStorage.setItem(`sukimap:organizer:${data.publicId}`, data.organizerToken);
      router.push(`/events/${data.publicId}?created=1`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "作成できませんでした"); setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-5 ring-1 ring-emerald-100 md:p-8">
      <label className="block font-bold">イベント名<input className={inputClass} name="title" maxLength={100} required placeholder="夏の打ち合わせ" /></label>
      <label className="block font-bold">説明（任意）<textarea className={`${inputClass} min-h-24 py-3`} name="description" maxLength={500} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-bold">候補開始日<input className={inputClass} type="date" name="startDate" defaultValue={today} required /></label>
        <label className="font-bold">候補終了日<input className={inputClass} type="date" name="endDate" defaultValue={today} required /></label>
        <label className="font-bold">開始時刻<select className={inputClass} name="startHour" defaultValue="9">{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{hour}:00</option>)}</select></label>
        <label className="font-bold">終了時刻<select className={inputClass} name="endHour" defaultValue="22">{Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}</select></label>
        <label className="font-bold">時間単位<select className={inputClass} name="slotMinutes" defaultValue="30"><option value="15">15分</option><option value="30">30分</option></select></label>
        <label className="font-bold">必要な連続時間<select className={inputClass} name="requiredDurationMin" defaultValue="60"><option value="30">30分</option><option value="60">1時間</option><option value="90">1時間30分</option><option value="120">2時間</option><option value="180">3時間</option></select></label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
      <button disabled={submitting} className="min-h-12 w-full rounded-full bg-emerald-700 font-bold text-white disabled:opacity-60">{submitting ? "作成中…" : "共有URLを作る"}</button>
    </form>
  );
}
