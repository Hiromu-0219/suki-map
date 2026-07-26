import { EventForm } from "@/components/event-form";

export default function NewEventPage() {
  return <div className="mx-auto max-w-2xl px-4 py-10"><p className="font-bold text-emerald-700">STEP 1</p><h1 className="mt-2 text-3xl font-black">日程調整を作る</h1><p className="mb-7 mt-3 text-slate-600">候補期間は最大14日。あとから共有URLをみんなに送れます。</p><EventForm /></div>;
}
