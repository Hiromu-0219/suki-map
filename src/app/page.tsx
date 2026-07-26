import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">ログイン不要</span>
          <h1 className="mt-5 text-4xl font-black leading-tight text-emerald-950 md:text-6xl">空き時間を塗って、<br />みんなの「すき」を地図に。</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">指でなぞるだけの日程調整。細かな時間の重なりをヒートマップで見つけられます。</p>
          <Link href="/events/new" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-emerald-700 px-7 font-bold text-white">日程調整を作る</Link>
        </div>
        <div className="grid grid-cols-5 gap-2 self-center rounded-3xl bg-white p-6 ring-1 ring-emerald-100">
          {Array.from({ length: 30 }, (_, index) => <div key={index} className="aspect-square rounded-lg" style={{ background: `rgba(5,150,105,${(index % 5) * 0.17 + 0.08})` }} />)}
        </div>
      </section>
      <section className="bg-emerald-950 px-5 py-14 text-white">
        <div className="mx-auto max-w-5xl"><h2 className="text-center text-2xl font-black">3ステップで、ぴったりの時間</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">{["候補日を決める", "みんなで空き時間を塗る", "重なった時間を選ぶ"].map((label, index) => <li key={label} className="rounded-2xl bg-white/10 p-5"><b className="text-amber-300">0{index + 1}</b><p className="mt-2 font-bold">{label}</p></li>)}</ol>
        </div>
      </section>
    </div>
  );
}
