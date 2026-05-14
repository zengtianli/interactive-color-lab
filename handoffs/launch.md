# Handoff · interactive-color-lab · launch

> 2026-05-05 · 项目从 0 → live · 两模块 + GitHub + color.tianlizeng.cloud 全部就位

## 当前进展

### Stage A · 骨架（主进程串行）
- `npx create-next-app@latest` Next.js 16 + TS + Tailwind v4 + App Router
- 装 `react-colorful` + `html-to-image`
- `app/page.tsx` 首页 · 两模块卡片
- `app/layout.tsx` 中文 lang + 亮色背景 + Geist 字体
- `CLAUDE.md` / `README.md` / `README_CN.md`
- `git init` + 初始 commit

### Stage B · 模块一 `/free`（agent 并发完成）
- 单文件 `app/free/page.tsx` ~330 行
- 73 个独立 path（中心圆 + 内瓣 + 内环弧 + 中瓣 + 细环弧 + 外瓣，12 段旋转对称）
- `useMemo(() => buildMandala())` 缓存几何，规避 React 19 新规则 `react-hooks/use-memo`
- `<HexColorPicker>` + 当前色块 + hex 输入 + 10 色预设
- 顶栏：重置 / 导出 PNG（`html-to-image` `toPng` + a.download） / 保存到画廊
- localStorage `free-coloring-gallery` 存最近 5 张（含 quota 兜底 trim 到 3）
- 画廊「点击恢复」未实现 — 只显示缩略图（spec 已明示先简化）

### Stage C · 模块二 `/pattern`（agent 并发完成）
- 单文件 `app/pattern/page.tsx` ~360 行
- 3 槽位（① 内圈主色 / ② 外圈外环 / ③ 四方交叉色），单色轮展开（点新槽自动收旧）
- 默认配色：`#C49A4F` / `#3D2817` / `#7A5230`
- 单元图 SVG 三层 `<g>`（圆盘+菱形星芒 / 双圆环+4 对角羚羊侧影简化几何 / 8 条放射斜线 + 4 角菱形）
- 平铺：SVG `<defs><pattern patternUnits="userSpaceOnUse" w=400 h=400>` + `<rect fill="url(#ptn-tile)">`，1600×1600 viewBox = 4×4
- 顶栏：重置默认 / 导出 PNG（pixelRatio=2 白底）

### Stage D · 上线（主进程串行）
- `next.config.ts`: `output: 'export'` + `images.unoptimized: true` + `trailingSlash: true`
- `npm run build` → `out/` 全 prerendered（4 路由 ○ Static）
- `rsync -avz --delete out/ root@104.218.100.67:/var/www/color/`
- nginx vhost 渲自 `~/Dev/devtools/lib/templates/nginx-static.conf` → `/etc/nginx/sites-available/color.tianlizeng.cloud`，软链 enable，`nginx -t && reload`
- `cf_api.py dns add color` → A 记录 proxied
- `cf_api.py origin-rules add color.tianlizeng.cloud 8443`
- **无 CF Access**（公开站）
- 验证：`/`, `/free/`, `/pattern/` 全 HTTP/2 200，`curl -s | grep` 确认中文文案 live

### SSOT 注册
- `menus/entities/subdomains.yaml` 加 `color` entity（无 access_type，备注独立子域 + 公开）
- `menus/relations/subdomain-group.yaml` 加 `color: applications  # 媒体`
- `menus.py audit` 17/17 全绿
- `menus.py build-services-ts -w` 重生 `stations/website/lib/services.ts`
- `menus.py build-react-mega-navbar -w` 重生 `stations/web-stack/packages/ui/src/shared/mega-navbar.tsx`

### Commits / push
| Repo | Commit | 远端 |
|---|---|---|
| `interactive-color-lab` | `feat(init): v0 双模块` + `chore(deploy): static export` | ✅ pushed to https://github.com/zengtianli/interactive-color-lab |
| `tools/configs` | `feat(menus): 注册 color.tianlizeng.cloud` | ✅ pushed |
| `stations` | `chore(navbar): 同步 menus SSOT` | ✅ pushed |

## 待完成

- [x] [P2] 主站 `tianlizeng.cloud` redeploy 让 navbar 显示 color 卡片 <!-- closed by cc-pulse: f2fb0d78 · 2. oauth-proxy 项目（你自己的 proxy.tianlizeng. -->
  - SSOT 已登记；触发：下次主站任何改动顺带 `/deploy website` 即可
  - 不阻塞 — color.tianlizeng.cloud 直链已可用
- [ ] [P2] 模块一画廊「点击恢复」交互
  - 现状：只显示缩略图；规格本就说"先简化"
  - 实现：点缩略图 → setFills(parsedFromDataURL?) 不可行，需改存 fills 对象（不只 dataURL）
  - 验收：点画廊缩略图 → 主图恢复到该状态
- [ ] [P2] 模块二平铺角菱形 tile 加回（如有视觉需求）
  - 现状：平铺版省略角菱形防接缝过密；full 单元图保留
  - 实现：在 PatternRepeat 的 tile path 里加回 corner diamonds，调小尺寸观察
- [ ] [external] 浏览器实测真实点击 / 导出 / 平铺刷新
  - CC 不能替你点击；live URL 是 https://color.tianlizeng.cloud
  - 任何 bug 反馈给下个会话立修

## 关键文件

| 文件 | 说明 |
|---|---|
| `/Users/tianli/Dev/labs/interactive-color-lab/app/page.tsx` | 首页（两卡片入口） |
| `/Users/tianli/Dev/labs/interactive-color-lab/app/free/page.tsx` | 模块一 · 自由填色 |
| `/Users/tianli/Dev/labs/interactive-color-lab/app/pattern/page.tsx` | 模块二 · 纹样拼色 |
| `/Users/tianli/Dev/labs/interactive-color-lab/next.config.ts` | static export 配置（不要去掉 `output: 'export'` 否则 ship 流程崩） |
| `/Users/tianli/Dev/labs/interactive-color-lab/CLAUDE.md` | 项目 CLAUDE.md |
| `/Users/tianli/Dev/tools/configs/menus/entities/subdomains.yaml` | SSOT — `color` entity 在此（**改这里，不改 services.ts**） |
| `/Users/tianli/Dev/tools/configs/menus/relations/subdomain-group.yaml` | SSOT — `color: applications` |
| `/etc/nginx/sites-available/color.tianlizeng.cloud` (VPS) | nginx vhost (port 8443 SSL) |
| `/var/www/color/` (VPS) | 静态站根（rsync 目标） |

## 踩过的坑

1. **`/site add` 抽象不匹配 Next.js**：`/site add` 是给 yaml→HTML 静态站脚手架（stack/changelog/docs/md-docs 模板），跟现成 Next.js 项目无关。下次新 Next.js 项目直接：`next.config.ts` 加 `output: 'export'` → `npm run build` → 走 `/site ship` 底层动作（rsync + nginx 模板 + cf_api dns + origin-rules），不要 `/site add`
2. **`cf_api.py` 子命令是 `origin-rules` 不是 `origin`**：`/cf origin add` 是 slash 简写，cf_api.py CLI 用 `origin-rules add <hostname> <port>`
3. **Bash HEREDOC 在某些 shell 上下文不稳**：commit message 多行用 `git commit -F /tmp/msg.txt` 更稳；`-m "$(cat <<EOF ... EOF)"` 偶发未闭合
4. **paths audit 状态**：`57 registered / 51 dead / 0 drift` — dead >50 是 Dev meta 级历史遗留（跟本项目无关）。下轮 Dev meta 会话跑 `python3 ~/Dev/devtools/lib/tools/paths.py scan-dead --strict` 处理

## 下个会话启动

```
cd ~/Dev/labs/interactive-color-lab && /start
```

或如果是来修 bug / 加功能：直接说"加功能 X"或"模块二的平铺有 bug 是 Y"，我从这份 handoff + retro 接上下文。

如果是来 deploy 主站让 navbar 立刻显示：
```
cd ~/Dev/stations/website && /deploy
```
