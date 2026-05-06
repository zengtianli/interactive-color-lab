# Interactive Color Lab

**English** | [中文](README_CN.md)

Interactive color-learning playground for kids and adults. Two modules:

- **Free Coloring** — point-and-click fill on a generated mandala SVG (low-age kids)
- **Pattern Color-Matching** — three-slot color picker driving a traditional gazelle pattern + 4×4 tiled preview (older kids + adults)

Built with **Next.js 16 · TypeScript · Tailwind v4 · react-colorful · html-to-image**.

## Quick Start

```bash
npm install
npm run dev          # localhost:3000
npm run build        # production
```

## Routes

| Route | Module |
|---|---|
| `/` | Landing — two module cards |
| `/free` | Free coloring — mandala SVG + color wheel + PNG export + localStorage gallery |
| `/pattern` | Pattern matching — 3 color slots + tile preview + 4×4 tiled output |

## Deploy

Targets `color.tianlizeng.cloud` via the station fleet pipeline (`/site add color` → `/deploy`).
