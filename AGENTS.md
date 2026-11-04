# AGENTS.md

## 发布流程

**先 commit，再 deploy。**

1. `bun run fix`
2. `bun run typecheck`
3. `git commit`
4. `git push origin main`

仓库已连接 Cloudflare Pages：push 到 `main` 会自动触发构建和部署。需要手动兜底时再执行 `bun run deploy`。

`deploy` 直接用工作区构建，未提交会让 Cloudflare 面板的 Source 落后；`predeploy` 还会往群里发「即将部署」通知。部署必须在仓库根目录执行，否则找不到 `functions/`。

## 常用命令

| 命令                                | 作用                                  |
| ----------------------------------- | ------------------------------------- |
| `bun run dev`                       | 并行启动前端（5173）和 API（8788）    |
| `bun run dev:bot`                   | API + 本地 bot 长轮询，一条命令全起来 |
| `bun run build`                     | 构建前端到 `apps/web/dist`            |
| `bun run deploy`                    | 构建并部署到 Cloudflare Pages         |
| `bun run bot:webhook`               | 安装线上 webhook 并同步命令菜单       |
| `bun run d1:migrate:local`          | 应用本地 D1 迁移                      |
| `bun run db:generate`               | 由 Drizzle schema 生成迁移            |
| `bun run cf:typegen`                | 生成绑定类型                          |
| `bun run fix` / `bun run typecheck` | 自动修复 / 类型检查                   |

## 目录

```text
apps/web/    Vite + React 前端
apps/api/    Hono 接口（/api/*）
apps/bot/    Telegram bot（/bot/*）
packages/db  Drizzle schema 与迁移
functions/   Pages Functions 入口
wrangler.jsonc
```

## 约定

- 这是 Cloudflare Pages 项目，不是 Cloudflare Workers 项目。
- 用 `bun` / `bunx`，不装全局依赖。
- `.env` 会覆盖 `wrangler.jsonc` 里的同名 vars；secrets 不要提交。
- `functions/`、`apps/api/`、`apps/bot/`、`wrangler.jsonc` 必须提交，否则线上拿不到新代码。
- `old` 分支保留旧仓库 `Niapya/HackHTU` 的历史（截至 `870dd36`），不参与构建，Pages 预览已排除该分支。

## 数据

站点和 bot 共用 D1 `HackHTUDB`（绑定 `DB`）。迁移：

```sh
bun run db:generate
bunx wrangler d1 migrations apply HackHTUDB --local
bunx wrangler d1 migrations apply HackHTUDB --remote
```

本地库为空时 bot 会报 `no such table`，先跑 `bun run d1:migrate:local`。

## Telegram Bot

- 通过 `functions/bot/[[route]].ts` 挂到 Pages，不单独部署 Worker。
- `allowed_updates` 必须包含 `message`、`callback_query`、`chat_member`。大群的加入事件只走 `chat_member`，漏订阅会让加群验证完全不触发。
- 本地调试推荐 `bun run dev:bot`。`bun run bot:poll` 会顶掉线上 webhook，测完必须 `bun run bot:webhook` 装回去。
- 机器人需要群管理员权限：删除消息、封禁用户、限制成员。
- 配置在 `wrangler.jsonc` 的 `vars`，secrets 在 Pages → Settings → Variables and Secrets；改完 vars 跑 `bun run cf:typegen`。

## 部署

| 项             | 值              |
| -------------- | --------------- |
| 构建命令       | `bun run build` |
| 输出目录       | `apps/web/dist` |
| Root directory | `/`             |

Vite 只构建静态资源，`functions/` 由 Wrangler 单独打包。`predeploy` 用 `BOT_TOKEN` 发群通知，失败只告警；`bun run predeploy -- --dry-run` 可只预览。

`VITE_*` 是构建期变量，写在根目录 `.env.production`（只能放公开值）。Cloudflare Pages 的 Git 构建不会注入面板里的 `VITE_*`，缺 `VITE_TURNSTILE_SITE_KEY` 时构建会直接报错。
