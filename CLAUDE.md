# Interactive Color Lab

交互式色彩实验室 — 两个面向不同年龄段的色彩教学/玩耍模块。

## Quick Reference

| 项目 | 路径/值 |
|---|---|
| 入口 | `app/page.tsx` |
| 模块一 | `app/free/page.tsx` — 自由填色（低龄儿童） |
| 模块二 | `app/pattern/page.tsx` — 纹样拼色（大龄儿童 + 成人） |
| 部署 | VPS · `color.tianlizeng.cloud`（待 ship） |
| 栈 | Next.js 16 + TypeScript + Tailwind v4 + react-colorful + html-to-image |

## 常用命令

```bash
cd ~/Dev/labs/interactive-color-lab
npm run dev      # localhost:3000
npm run build    # 生产构建
npm run lint
```

## 项目结构

```
.
├── app/
│   ├── page.tsx          # 首页 · 两模块卡片
│   ├── layout.tsx
│   ├── globals.css
│   ├── free/page.tsx     # 模块一
│   └── pattern/page.tsx  # 模块二
├── public/
└── package.json
```

## 设计约束（写代码前必读）

1. **Next.js 16 是新版本**，与训练数据里的 Next.js 不同。改之前先读 `node_modules/next/dist/docs/01-app/`
2. **亮色背景**（用户偏好），所有页面不要 dark mode
3. **信息密集但不拥挤**，桌面优先（`>=1024px` 双栏），手机端可堆叠
4. 交互组件必须 `'use client'`
5. SVG 直接改 `fill` attr（不用 flood-fill），状态用 `useState` 维护 `Record<pathId, color>` 或 `{part1, part2, part3}`

## 模块一规格速览

- 左：代码生成的曼陀罗 SVG（30+ 独立 path）
- 右：`<HexColorPicker>` + 最近用过 10 色
- 顶栏：重置 / 导出 PNG（`html-to-image`）/ 保存到画廊（localStorage `free-coloring-gallery`，最近 5 张）
- 底部：画廊横排缩略图

## 模块二规格速览

- 左：3 槽位（① 内圈主色 / ② 外圈外环 / ③ 四方交叉色），每槽点开 `<HexColorPicker>`
- 右上：单元图（羚羊纹样三层 SVG，每层独立 `<g>`）
- 右下：SVG `<pattern>` 平铺（与单元图共享 fill state，实时刷新）
- 默认配色：① `#C49A4F` ② `#3D2817` ③ `#7A5230`

## 部署（待做）

走站群：`/site add color` → nginx + CF DNS + Access app + website 卡片 → `/deploy`。
