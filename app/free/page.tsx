'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toPng } from 'html-to-image';

// ---- Mandala geometry ---------------------------------------------------
// Procedurally generates ~50 independent fillable paths arranged in
// concentric rings + petal layers, with 12-fold rotational symmetry.

const VIEW = 600;
const CENTER = VIEW / 2;
const SEGMENTS = 12;

type MandalaPath = { id: string; d: string };

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const p1 = polar(cx, cy, rOuter, startAngle);
  const p2 = polar(cx, cy, rOuter, endAngle);
  const p3 = polar(cx, cy, rInner, endAngle);
  const p4 = polar(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function petalPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  centerAngle: number,
  spread: number,
): string {
  const tip = polar(cx, cy, rOuter, centerAngle);
  const left = polar(cx, cy, rInner, centerAngle - spread);
  const right = polar(cx, cy, rInner, centerAngle + spread);
  const ctrlL = polar(cx, cy, (rInner + rOuter) / 2, centerAngle - spread * 0.4);
  const ctrlR = polar(cx, cy, (rInner + rOuter) / 2, centerAngle + spread * 0.4);
  return [
    `M ${left.x.toFixed(2)} ${left.y.toFixed(2)}`,
    `Q ${ctrlL.x.toFixed(2)} ${ctrlL.y.toFixed(2)} ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    `Q ${ctrlR.x.toFixed(2)} ${ctrlR.y.toFixed(2)} ${right.x.toFixed(2)} ${right.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function buildMandala(): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const step = 360 / SEGMENTS;

  // Center disc
  paths.push({
    id: 'core',
    d: `M ${CENTER} ${CENTER - 28} A 28 28 0 1 1 ${CENTER} ${CENTER + 28} A 28 28 0 1 1 ${CENTER} ${CENTER - 28} Z`,
  });

  // Inner petals (6, alternating, large)
  for (let i = 0; i < 6; i++) {
    const angle = i * (360 / 6);
    paths.push({
      id: `inner-petal-${i}`,
      d: petalPath(CENTER, CENTER, 28, 90, angle, 26),
    });
  }

  // Ring 1: 12 arc slices
  for (let i = 0; i < SEGMENTS; i++) {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    paths.push({
      id: `ring1-${i}`,
      d: arcPath(CENTER, CENTER, 90, 130, a0, a1),
    });
  }

  // Ring 2: 12 petals pointing outward
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = i * step + step / 2;
    paths.push({
      id: `mid-petal-${i}`,
      d: petalPath(CENTER, CENTER, 130, 200, angle, 12),
    });
  }

  // Ring 3: 24 narrow arcs
  for (let i = 0; i < SEGMENTS * 2; i++) {
    const a0 = i * (step / 2);
    const a1 = (i + 1) * (step / 2);
    paths.push({
      id: `ring3-${i}`,
      d: arcPath(CENTER, CENTER, 200, 230, a0, a1),
    });
  }

  // Outer petals: 12 large
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = i * step;
    paths.push({
      id: `outer-petal-${i}`,
      d: petalPath(CENTER, CENTER, 230, 290, angle, 14),
    });
  }

  return paths;
}

const PRESET_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#111827',
  '#ffffff',
];

const GALLERY_KEY = 'free-coloring-gallery';
const MAX_GALLERY = 5;

type GalleryItem = { ts: number; src: string };

export default function FreeColoringPage() {
  const paths = useMemo(() => buildMandala(), []);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [currentColor, setCurrentColor] = useState<string>('#3b82f6');
  const [recent, setRecent] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(GALLERY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as GalleryItem[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_GALLERY) : [];
    } catch {
      return [];
    }
  });
  const svgWrapRef = useRef<HTMLDivElement | null>(null);

  const handlePathClick = useCallback(
    (id: string) => {
      setFills((prev) => ({ ...prev, [id]: currentColor }));
      setRecent((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== currentColor.toLowerCase());
        return [currentColor, ...filtered].slice(0, 10);
      });
    },
    [currentColor],
  );

  const handleReset = useCallback(() => {
    setFills({});
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!svgWrapRef.current) return;
    try {
      const dataUrl = await toPng(svgWrapRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `mandala-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('export png failed', err);
    }
  }, []);

  const handleSaveGallery = useCallback(async () => {
    if (!svgWrapRef.current) return;
    try {
      const dataUrl = await toPng(svgWrapRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: '#ffffff',
      });
      const next: GalleryItem[] = [{ ts: Date.now(), src: dataUrl }, ...gallery].slice(
        0,
        MAX_GALLERY,
      );
      setGallery(next);
      try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(next));
      } catch {
        // quota exceeded — drop oldest until it fits
        const trimmed = next.slice(0, 3);
        try {
          localStorage.setItem(GALLERY_KEY, JSON.stringify(trimmed));
          setGallery(trimmed);
        } catch {
          // give up silently
        }
      }
    } catch (err) {
      console.error('save gallery failed', err);
    }
  }, [gallery]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              ← 返回首页
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">模块一 · 自由填色</h1>
            <span className="hidden text-xs text-slate-500 sm:inline">
              点击线稿区块即可填入当前颜色
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-slate-50"
            >
              重置
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-slate-50"
            >
              导出 PNG
            </button>
            <button
              type="button"
              onClick={handleSaveGallery}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white shadow-sm transition hover:bg-slate-700"
            >
              保存到画廊
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        {/* Canvas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div
            ref={svgWrapRef}
            className="mx-auto flex aspect-square w-full max-w-[640px] items-center justify-center"
          >
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
              role="img"
              aria-label="可填色曼陀罗"
            >
              <rect x={0} y={0} width={VIEW} height={VIEW} fill="#ffffff" />
              {paths.map((p) => (
                <path
                  key={p.id}
                  d={p.d}
                  fill={fills[p.id] ?? '#ffffff'}
                  stroke="#1f2937"
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  onClick={() => handlePathClick(p.id)}
                  style={{ cursor: 'pointer', transition: 'fill 120ms ease' }}
                />
              ))}
            </svg>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            共 {paths.length} 个独立可填色区域 · 12 段旋转对称
          </p>
        </section>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">当前颜色</h2>
            <HexColorPicker
              color={currentColor}
              onChange={setCurrentColor}
              style={{ width: '100%' }}
            />
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-slate-200 shadow-inner"
                style={{ backgroundColor: currentColor }}
                aria-label={`当前颜色 ${currentColor}`}
              />
              <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-700">
                {currentColor.toUpperCase()}
              </code>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                预设
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrentColor(c)}
                    className="h-7 w-7 rounded-md border border-slate-200 shadow-sm transition hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`选择 ${c}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">最近用过</h2>
            {recent.length === 0 ? (
              <p className="text-xs text-slate-400">还没有填色记录</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recent.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    onClick={() => setCurrentColor(c)}
                    className="h-7 w-7 rounded-md border border-slate-200 shadow-sm transition hover:scale-110"
                    style={{ backgroundColor: c }}
                    title={c}
                    aria-label={`复用 ${c}`}
                  />
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-700">画廊</h2>
            <span className="text-xs text-slate-400">最近 {MAX_GALLERY} 张</span>
          </div>
          {gallery.length === 0 ? (
            <p className="text-xs text-slate-400">点击「保存到画廊」可留存当前作品</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {gallery.map((item) => (
                <li
                  key={item.ts}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={`作品 ${new Date(item.ts).toLocaleString()}`}
                    className="block aspect-square w-full object-cover"
                  />
                  <div className="border-t border-slate-200 px-2 py-1 text-[10px] text-slate-500">
                    {new Date(item.ts).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
