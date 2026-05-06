import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Interactive Color Lab
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          交互式色彩实验室 · 自由填色 + 传统纹样拼色
        </p>
      </header>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        <Link
          href="/free"
          className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
              🎨
            </span>
            <h2 className="text-2xl font-semibold text-zinc-900">自由填色</h2>
          </div>
          <p className="text-sm leading-6 text-zinc-600">
            点选色轮上的颜色，再点击曼陀罗的任意区域为它上色。适合低龄儿童的色彩启蒙。
          </p>
          <span className="mt-2 text-sm font-medium text-amber-700 group-hover:text-amber-900">
            进入模块 →
          </span>
        </Link>

        <Link
          href="/pattern"
          className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-xl">
              🪷
            </span>
            <h2 className="text-2xl font-semibold text-zinc-900">纹样拼色</h2>
          </div>
          <p className="text-sm leading-6 text-zinc-600">
            为传统羚羊纹样的内圈、外环、四方连续三个层级独立配色，理解传统纹样的色彩结构。
          </p>
          <span className="mt-2 text-sm font-medium text-rose-700 group-hover:text-rose-900">
            进入模块 →
          </span>
        </Link>
      </div>

      <footer className="mt-16 text-xs text-zinc-500">
        Built with Next.js 16 · Tailwind v4 · react-colorful
      </footer>
    </div>
  );
}
