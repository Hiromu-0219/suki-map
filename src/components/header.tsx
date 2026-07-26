import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-emerald-100 bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-black text-emerald-800">すきまっぷ</Link>
        <Link href="/events/new" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white">日程調整を作る</Link>
      </div>
    </header>
  );
}
