# Interactive Color Lab · 交互色彩实验室

[English](README.md) | **中文**

面向儿童与成人的交互式色彩学习/玩耍站。两个模块：

- **自由填色** — 在代码生成的曼陀罗 SVG 上点选填色（低龄儿童色彩启蒙）
- **纹样拼色** — 用 3 槽位色轮驱动传统羚羊纹样 + 实时刷新 4×4 四方连续平铺（大龄儿童 + 成人理解传统纹样色彩结构）

技术栈：**Next.js 16 · TypeScript · Tailwind v4 · react-colorful · html-to-image**。

## 快速开始

```bash
npm install
npm run dev          # localhost:3000
npm run build        # 生产构建
```

## 路由

| 路径 | 模块 |
|---|---|
| `/` | 首页 — 两模块卡片 |
| `/free` | 自由填色 — 曼陀罗 SVG + 色轮 + 导出 PNG + localStorage 画廊 |
| `/pattern` | 纹样拼色 — 3 色槽 + 单元图 + 4×4 平铺 |

## 部署

通过站群链路上 `color.tianlizeng.cloud`：`/site add color` → `/deploy`。
