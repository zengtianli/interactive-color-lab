# Session Retro · interactive-color-lab launch · 2026-05-05

> 0 → 1 一会话端到端：需求对齐 → Next.js 16 项目 → 双模块 → 上线 https://color.tianlizeng.cloud → SSOT 注册 → GitHub repo

## 1. 做对了什么

- **颗粒度对齐先行**：用户给完需求后，我先列 3 个拍板问题（素材/导出/上线？）+ 5 个我已替用户拍板的小决策（库选型/平铺技术/子域名），给"我推荐"硬选项 — 一句"全部，按收益率最高"就开工，没多轮反复
- **Agent team 并行编排**：Stage A 主进程做骨架 + B/C 两个 agent 后台并发写模块。两个模块互不依赖，agent prompt 互锁了文件边界（"不创建 page.tsx / 不动 layout.tsx / 不 commit / 不写 README"），并发跑 ~2 分钟出齐 730 行，比串行省一半
- **agent prompt 必含验证**：每个 agent 必须 `npm run build && lint clean` 才允许收工。两个 agent 都按要求做了，主进程 reverify 一次也过
- **Next.js 16 静态导出走 `/site ship` 路径**：识别出双模块都是纯客户端（零 SSR/API）→ `output: 'export'` 是最高 ROI（不用配 systemd / 反代 / 端口），rsync `out/` 走现成静态站 nginx 模板
- **实测验证铁律**：`curl -sI` 三路由全 HTTP/2 200 + `curl -s | grep` 验证关键中文文案出现在 live HTML 才算完
- **SSOT 一气呵成**：上线 done 后顺手注册 `menus/entities/subdomains.yaml` + `relations/subdomain-group.yaml`，跑 audit 17/17 全绿，regen `services.ts` + `mega-navbar.tsx` 提交 push，主站只差一次 deploy 就显示新卡

## 2. 走了哪些弯路

- **`/site add` 抽象不匹配**：`/site add` 是给 yaml→HTML 静态站脚手架用的（stack/changelog/docs 模板），不适合现成的 Next.js 项目。读 doc 后立即识别，绕开 `add` 直接走 `ship` 的底层动作（rsync + nginx 模板 + cf_api dns add + cf_api origin-rules add），没浪费时间。**根因**：site doc 把 add 和 ship 写在一起容易让人误会 add 是 ship 的前置；其实两条路独立
- **`cf_api origin add` 命令名**：site doc 写 `/cf origin add` 是 slash 简写，cf_api.py 实际子命令是 `origin-rules`。第一次报错 `invalid choice: 'origin'` 后改正。**根因**：slash command 名 ≠ Python CLI 子命令名，doc 默认 slash 上下文
- **Bash HEREDOC commit message 第一次失败**：用 `git commit -m "$(cat <<EOF ... EOF)"` 一次成功一次未触发 here-doc 闭合，改成 multi-line message 直接 `-m "..."`（含 \n）。下次 commit 多行用 `git commit -F /tmp/msg.txt` 更稳

## 3. 工程模式

### Pattern: 0→1 全栈站工程的 4 阶段一会话编排

```
A 骨架 (主进程·串行) → B/C 模块 (agent 并发) → D 上线 (主进程·串行) → SSOT 注册 + push
```

- A 串行：必须先 npm init / install / 写 layout 才能让 agents 有 base 可改
- B/C 并发：路由独立 + 文件边界锁死 → 真正零冲突并行
- D 串行：依赖 build 产物
- 总耗时 ~30 分钟（不含等用户）vs 全串行 ~50+ 分钟

### Pattern: Next.js 16 客户端-only → static export → 静态站 ship

- next.config.ts: `output: 'export'` + `images.unoptimized: true` + `trailingSlash: true`
- `npm run build` → `out/` 含全 prerendered html + `_next/static/`
- rsync 走 `~/Dev/devtools/lib/templates/nginx-static.conf` 模板（VPS:8443 + Origin SSL）
- CF: `dns add` + `origin-rules add port 8443` + 不要 access（公开）
- 跟 wpl-calc 是同一模式，可作为后续静态 SPA 的标准路径

### Pattern: 站群 SSOT 注册 = 子域上线的最后一步

子域 live 不等于"全部完成"。还要：
1. `entities/subdomains.yaml` 加 entity（含 description / name_en）
2. `relations/subdomain-group.yaml` 加 group 归属
3. `menus.py audit` 17/17 绿
4. `menus.py build-services-ts -w` + `build-react-mega-navbar -w` 重生消费者
5. 提交 push

## 4. 沟通反思

- **决策推荐立硬约束**生效：每个 fork 都给"我推荐 X"+"次选 Y"+理由，用户一句"按你推荐做"就推进，没散落讨论
- **commit/push 一气呵成**：4 次 commit 都没问"要不要 commit"，直接做了。最后总结里再列出来
- **末尾 2 个尾巴明确分离**：GitHub 推 vs 主站 redeploy，分别给推荐 + 次选，让用户一次决两件事

## 5. 成果清单

| 路径 | 内容 |
|---|---|
| `~/Dev/labs/interactive-color-lab/` | 项目根，Next.js 16 + TS + Tailwind v4 |
| `~/Dev/labs/interactive-color-lab/app/page.tsx` | 首页 · 两模块卡片 |
| `~/Dev/labs/interactive-color-lab/app/free/page.tsx` | 模块一 · 73 path 曼陀罗 + 色轮 + PNG 导出 + localStorage 画廊（330 行） |
| `~/Dev/labs/interactive-color-lab/app/pattern/page.tsx` | 模块二 · 3 槽位 + 羚羊纹样三层 + SVG `<pattern>` 4×4 平铺（360 行） |
| `~/Dev/labs/interactive-color-lab/next.config.ts` | `output: 'export'` 启用静态导出 |
| `~/Dev/labs/interactive-color-lab/CLAUDE.md` | 项目 CLAUDE.md（中文，含两模块速览） |
| `~/Dev/labs/interactive-color-lab/README.md` / `README_CN.md` | 双语 README |
| `~/Dev/tools/configs/menus/entities/subdomains.yaml` | 加 `color` entity |
| `~/Dev/tools/configs/menus/relations/subdomain-group.yaml` | 加 `color: applications` |
| `~/Dev/stations/website/lib/services.ts` | regen（含 color） |
| `~/Dev/stations/web-stack/packages/ui/src/shared/mega-navbar.tsx` | regen（含 color） |
| **GitHub** | https://github.com/zengtianli/interactive-color-lab (public) |
| **Live** | https://color.tianlizeng.cloud — 200，公开，无 Access |

## 6. 未完成项

- [ ] [P2] 主站 `tianlizeng.cloud` redeploy — navbar SSOT 已登记，等下次主站任何改动顺带上即可，不阻塞
- [ ] [P2] 模块一画廊「点击恢复」交互未实现（只显示缩略图）
- [ ] [P2] 模块二平铺版 tile 简化了角连接菱形（防止 4×4 接缝喧宾夺主，按需可加回）
- [ ] [external] 用户浏览器实测两个模块的真实点击/导出/平铺刷新（CC 没法替用户点击）
- 📍 `paths.py audit`: 57 reg / 51 dead / 0 drift — dead >50（属 Dev meta 级历史遗留，跟本项目无关，下轮 Dev meta 会话跑 `paths.py scan-dead --strict` 清）
