'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { toPng } from 'html-to-image';

type SlotKey = 'inner' | 'outer' | 'cross';

type Slot = {
  key: SlotKey;
  index: number;
  label: string;
  english: string;
  description: string;
};

const SLOTS: Slot[] = [
  {
    key: 'inner',
    index: 1,
    label: '内圈主色',
    english: 'Inner Circle Main Color',
    description: '中心圆盘 + 菱形星芒',
  },
  {
    key: 'outer',
    index: 2,
    label: '外圈外环',
    english: 'Outer Ring',
    description: '环形 + 四角羚羊侧影',
  },
  {
    key: 'cross',
    index: 3,
    label: '四方连续交叉色',
    english: 'Interlocking Color',
    description: '放射斜线 + 边缘连接',
  },
];

const DEFAULT_COLORS: Record<SlotKey, string> = {
  inner: '#C49A4F',
  outer: '#3D2817',
  cross: '#7A5230',
};

const TILE_SIZE = 400;

/**
 * 单元图（精细版） — 三层结构受 fillInner / fillOuter / fillCross 控制
 * Layer 1: 中心圆盘 + 内嵌菱形星芒
 * Layer 2: 外圈圆环 + 4 个对角羚羊几何侧影
 * Layer 3: 8 条放射状交叉斜线（延伸到 viewBox 边缘）
 */
function PatternTile({
  fillInner,
  fillOuter,
  fillCross,
  detail = 'full',
}: {
  fillInner: string;
  fillOuter: string;
  fillCross: string;
  detail?: 'full' | 'simple';
}) {
  const cx = TILE_SIZE / 2;
  const cy = TILE_SIZE / 2;

  // 简化版 antelope（三角身躯 + 弧线颈 + 头），相对中心放置后旋转
  // 单只大约 60×60 box 内构图
  const antelopePath =
    'M -20 18 L 20 18 L 14 -2 L 8 -8 L 14 -18 L 6 -22 L 2 -14 L -4 -10 L -16 -2 Z';

  return (
    <svg
      viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Layer 3 (底层): 放射状交叉斜线，延伸到边缘形成四方连续连接 */}
      <g fill={fillCross} stroke={fillCross}>
        {/* 4 条对角线（粗带） */}
        {[0, 45, 90, 135].map((deg) => (
          <rect
            key={`diag-${deg}`}
            x={cx - TILE_SIZE * 0.71}
            y={cy - 6}
            width={TILE_SIZE * 1.42}
            height={12}
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        ))}
        {/* 4 条次级斜线（细） */}
        {[22.5, 67.5, 112.5, 157.5].map((deg) => (
          <rect
            key={`diag-sub-${deg}`}
            x={cx - TILE_SIZE * 0.71}
            y={cy - 3}
            width={TILE_SIZE * 1.42}
            height={6}
            transform={`rotate(${deg} ${cx} ${cy})`}
            opacity={0.55}
          />
        ))}
        {/* 边角连接小方块 — 让 4×4 平铺时接缝处出现连续菱形 */}
        {detail === 'full' && (
          <>
            <rect x={0} y={0} width={28} height={28} transform={`rotate(45 0 0)`} />
            <rect x={TILE_SIZE} y={0} width={28} height={28} transform={`rotate(45 ${TILE_SIZE} 0)`} />
            <rect x={0} y={TILE_SIZE} width={28} height={28} transform={`rotate(45 0 ${TILE_SIZE})`} />
            <rect
              x={TILE_SIZE}
              y={TILE_SIZE}
              width={28}
              height={28}
              transform={`rotate(45 ${TILE_SIZE} ${TILE_SIZE})`}
            />
          </>
        )}
      </g>

      {/* Layer 2: 外圈圆环 + 4 个对角羚羊几何 */}
      <g fill={fillOuter}>
        {/* 外圈圆环（用粗 stroke 画环） */}
        <circle
          cx={cx}
          cy={cy}
          r={TILE_SIZE * 0.42}
          fill="none"
          stroke={fillOuter}
          strokeWidth={18}
        />
        {/* 内侧装饰细环 */}
        {detail === 'full' && (
          <circle
            cx={cx}
            cy={cy}
            r={TILE_SIZE * 0.34}
            fill="none"
            stroke={fillOuter}
            strokeWidth={3}
          />
        )}
        {/* 4 只对角羚羊侧影（NE / SE / SW / NW） */}
        {[45, 135, 225, 315].map((deg) => (
          <g
            key={`ant-${deg}`}
            transform={`rotate(${deg} ${cx} ${cy}) translate(${cx} ${cy - TILE_SIZE * 0.42})`}
          >
            <path d={antelopePath} />
          </g>
        ))}
      </g>

      {/* Layer 1 (顶层): 中心圆盘 + 菱形星芒 */}
      <g fill={fillInner}>
        {/* 中心实心圆盘 */}
        <circle cx={cx} cy={cy} r={TILE_SIZE * 0.22} />
        {/* 8 角星芒（两个旋转 45° 的方块） */}
        <rect
          x={cx - TILE_SIZE * 0.13}
          y={cy - TILE_SIZE * 0.13}
          width={TILE_SIZE * 0.26}
          height={TILE_SIZE * 0.26}
          transform={`rotate(45 ${cx} ${cy})`}
          opacity={0.95}
        />
        {detail === 'full' && (
          <rect
            x={cx - TILE_SIZE * 0.11}
            y={cy - TILE_SIZE * 0.11}
            width={TILE_SIZE * 0.22}
            height={TILE_SIZE * 0.22}
            opacity={0.85}
          />
        )}
        {/* 中心点高光 */}
        <circle cx={cx} cy={cy} r={TILE_SIZE * 0.05} opacity={0.6} />
      </g>
    </svg>
  );
}

/**
 * 四方连续平铺图 — 用 SVG <pattern> 引擎，颜色变化时 React 重渲染整个 svg
 */
function PatternRepeat({
  fillInner,
  fillOuter,
  fillCross,
}: {
  fillInner: string;
  fillOuter: string;
  fillCross: string;
}) {
  const cx = TILE_SIZE / 2;
  const cy = TILE_SIZE / 2;
  const antelopePath =
    'M -20 18 L 20 18 L 14 -2 L 8 -8 L 14 -18 L 6 -22 L 2 -14 L -4 -10 L -16 -2 Z';

  return (
    <svg
      viewBox={`0 0 ${TILE_SIZE * 4} ${TILE_SIZE * 4}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern
          id="ptn-tile"
          x={0}
          y={0}
          width={TILE_SIZE}
          height={TILE_SIZE}
          patternUnits="userSpaceOnUse"
        >
          {/* 简化版 tile（detail=simple）— 与 PatternTile simple 同结构，节省渲染 */}
          <g fill={fillCross}>
            {[0, 45, 90, 135].map((deg) => (
              <rect
                key={`r-diag-${deg}`}
                x={cx - TILE_SIZE * 0.71}
                y={cy - 6}
                width={TILE_SIZE * 1.42}
                height={12}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            ))}
            {[22.5, 67.5, 112.5, 157.5].map((deg) => (
              <rect
                key={`r-sub-${deg}`}
                x={cx - TILE_SIZE * 0.71}
                y={cy - 3}
                width={TILE_SIZE * 1.42}
                height={6}
                transform={`rotate(${deg} ${cx} ${cy})`}
                opacity={0.55}
              />
            ))}
          </g>
          <g fill={fillOuter}>
            <circle
              cx={cx}
              cy={cy}
              r={TILE_SIZE * 0.42}
              fill="none"
              stroke={fillOuter}
              strokeWidth={18}
            />
            {[45, 135, 225, 315].map((deg) => (
              <g
                key={`r-ant-${deg}`}
                transform={`rotate(${deg} ${cx} ${cy}) translate(${cx} ${cy - TILE_SIZE * 0.42})`}
              >
                <path d={antelopePath} />
              </g>
            ))}
          </g>
          <g fill={fillInner}>
            <circle cx={cx} cy={cy} r={TILE_SIZE * 0.22} />
            <rect
              x={cx - TILE_SIZE * 0.13}
              y={cy - TILE_SIZE * 0.13}
              width={TILE_SIZE * 0.26}
              height={TILE_SIZE * 0.26}
              transform={`rotate(45 ${cx} ${cy})`}
              opacity={0.95}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ptn-tile)" />
    </svg>
  );
}

export default function PatternPage() {
  const [colors, setColors] = useState<Record<SlotKey, string>>(DEFAULT_COLORS);
  const [openSlot, setOpenSlot] = useState<SlotKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const setColor = (key: SlotKey, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
    setOpenSlot(null);
  };

  const handleExport = async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `pattern-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-900">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md border border-stone-300 px-2.5 py-1 text-sm text-stone-600 transition hover:border-stone-400 hover:bg-stone-100"
            >
              ← 返回
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">
              模块二 · 纹样拼色
              <span className="ml-2 text-sm font-normal text-stone-500">
                Pattern Color Composer
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-100"
            >
              重置默认
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 disabled:opacity-60"
            >
              {exporting ? '导出中…' : '导出 PNG'}
            </button>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        {/* 左：控制区 */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-stone-700">配色槽位</h2>
            <p className="text-xs leading-relaxed text-stone-500">
              点击色块展开调色器；同一时间仅一个色轮打开。颜色变更后预览实时刷新。
            </p>
          </div>

          {SLOTS.map((slot) => {
            const isOpen = openSlot === slot.key;
            const value = colors[slot.key];
            return (
              <div
                key={slot.key}
                className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {slot.index}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-stone-800">
                          {slot.label}
                        </div>
                        <div className="truncate text-[11px] text-stone-500">
                          {slot.english}
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500">{slot.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setOpenSlot(isOpen ? null : slot.key)}
                        className="h-9 w-9 shrink-0 rounded-md border border-stone-300 shadow-inner transition hover:scale-105"
                        style={{ backgroundColor: value }}
                        aria-label={`打开 ${slot.label} 调色器`}
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(slot.key, v);
                        }}
                        className="w-full rounded-md border border-stone-300 px-2 py-1 font-mono text-xs text-stone-800 focus:border-stone-500 focus:outline-none"
                      />
                    </div>
                    {isOpen && (
                      <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                        <HexColorPicker
                          color={value}
                          onChange={(c) => setColor(slot.key, c)}
                          style={{ width: '100%', height: 180 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
            <strong>默认配色</strong>参考传统羚羊纹样：金黄 / 深棕 / 中棕。可任意改动后导出。
          </div>
        </aside>

        {/* 右：预览区 */}
        <section className="flex flex-col gap-6">
          <div ref={previewRef} className="flex flex-col gap-6">
            {/* 上：单元图 */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-700">单元图 · Tile</h2>
                <span className="text-[11px] text-stone-500">400 × 400 viewBox</span>
              </div>
              <div className="mx-auto aspect-square w-full max-w-[400px] overflow-hidden rounded-lg bg-stone-100">
                <PatternTile
                  fillInner={colors.inner}
                  fillOuter={colors.outer}
                  fillCross={colors.cross}
                  detail="full"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                {SLOTS.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-1"
                  >
                    <span
                      className="h-3 w-3 rounded-sm border border-stone-300"
                      style={{ backgroundColor: colors[s.key] }}
                    />
                    <span className="truncate font-mono text-stone-700">
                      {colors[s.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 下：四方连续 */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-700">
                  四方连续 · 4 × 4 平铺
                </h2>
                <span className="text-[11px] text-stone-500">SVG &lt;pattern&gt;</span>
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-stone-100">
                <PatternRepeat
                  fillInner={colors.inner}
                  fillOuter={colors.outer}
                  fillCross={colors.cross}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
