# AGENTS.md

本文件是仓库的开发与运维手册，面向参与本项目的人（和 coding agent）。

## 工作约定

### 发布流程

**先 commit，再 deploy。**

1. `bun run fix`
2. `bun run typecheck`（涉及构建时再跑 `bun run build`）
3. `git add ... && git commit`
4. `git push origin main`
5. `bun run deploy`

原因：

- `bun run deploy` 直接用当前工作区构建，未提交就部署会让 Cloudflare 面板的 Source 停留在上一个 commit，出问题不好回溯。
- 部署会触发 `predeploy`，往 `NOTIFY_CHATS` 发「即将部署」群通知，不值得为未提交的改动发两次。
- 先 push 再 deploy，能保证远程仓库和线上版本一致。

### 其他约定

- 临时文件放 `.tmp/`。
- 计划放 `.plan/PLAN_{N}.md`，待办放 `.todo/TODO_{N}.md`。
- 不安装全局依赖，JavaScript/TypeScript 用 `bun` / `bunx`。
- 改完代码至少跑 `bun run fix` 和 `bun run typecheck`。

---

## 技术栈

| 层   | 选型                                                           |
| ---- | -------------------------------------------------------------- |
| 构建 | Bun + Vite 7                                                   |
| 前端 | React 19 · TanStack Router · Tailwind CSS v4 · shadcn 风格组件 |
| 接口 | Hono 4 · Zod                                                   |
| 数据 | Cloudflare D1 · Drizzle ORM                                    |
| AI   | Workers AI 绑定 · Vercel AI SDK · `workers-ai-provider`        |
| Bot  | grammy · `@grammyjs/stream` · `@grammyjs/auto-retry`           |
| 托管 | Cloudflare Pages（静态资源 + Pages Functions）                 |

## 目录结构

```text
apps/
  web/     Vite + React 前端，构建到 apps/web/dist
  api/     Hono 接口（/api/*），挂到 Pages Functions
  bot/     Telegram bot（/bot/*），含本地脚本 scripts/
packages/
  db/      Drizzle schema 与迁移（packages/db/drizzle）
  ai/      AI 提示词、工具与模型适配
functions/ Pages Functions 入口，转发到 apps/api 与 apps/bot
wrangler.jsonc  Pages 项目配置、vars、D1 与 AI 绑定
```

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `bun run dev` | 并行启动 `dev:web` 与 `dev:api` |
| `bun run dev:api` | 本地 Wrangler（8788）+ 本地 D1，读根目录 `.env` |
| `bun run dev:bot` | `dev:api` + `bot:poll:local`，一条命令全起来 |
| `bun run build` | 构建前端到 `apps/web/dist` |
| `bun run preview` | 先构建再预览 `apps/web/dist` |
| `bun run deploy` | `build` + `wrangler pages deploy apps/web/dist` |
| `bun run bot:webhook` | 安装线上 webhook 并同步命令菜单 |
| `bun run bot:poll:local` | 长轮询 → 转发到 `http://localhost:8788` |
| `bun run d1:migrate:local` | 应用本地 D1 迁移（幂等） |
| `bun run db:generate` | 由 Drizzle schema 生成迁移 |
| `bun run cf:typegen` | 生成绑定类型到 `worker-configuration.d.ts` |
| `bun run typecheck` / `bun run check` | 类型检查 / 全量检查 |
| `bun run fix` | Ultracite 自动修复 |

## 数据与 D1

站点和 Telegram bot 共用同一个 D1：`HackHTUDB`，绑定名 `DB`。`packages/db/drizzle/0000_*.sql` 是完整建表基线，包含课程、评价、评论，以及 bot 的 `rss_history` / `ai_context` / `ai_summary` / `ai_memory` / `verifications` / `bot_meta`。

```sh
bun run db:generate
bunx wrangler d1 migrations apply HackHTUDB --local    # 本地
bunx wrangler d1 migrations apply HackHTUDB --remote   # 远程必须显式加 --remote
```

查询示例：

```sh
bun run d1:local -- --command="SELECT * FROM class_info LIMIT 5"
```

> 旧库 `hackhtu-class-recommend` 已停用，保留用于回滚；数据已迁移到 `HackHTUDB`。

## 站点事件通知

站点写库成功后会把事件同步推到 Telegram 群，群里能第一时间看到站点动态：

- `POST /api/comments`：意见反馈新增留言
- `POST /api/wall/posts`：校园树洞墙新增帖子
- `POST /api/wall/posts/:id/comments`：校园树洞墙新增评论
- `POST /api/classes`：新增课程
- `POST /api/classes/:id/reviews`：新增课程评价
- `POST /api/places/spots`：校园生活地图新增地点
- `POST /api/places/spots/:id/reviews`：校园生活地图新增评价

用 `sendRichMessage`（rich Markdown + 站点链接）发到 `NOTIFY_CHATS`（和 RSS 推送共用目标列表）。没配 `BOT_TOKEN` 或目标群时自动跳过；rich 排版被拒会退化成纯文本；发送通过 `waitUntil` 异步执行，不阻塞接口响应。

## Telegram Bot

bot 源码在 `apps/bot`，通过 `functions/bot/[[route]].ts` 挂到同一个 Pages 项目，不单独部署 Worker。

**路由**

| 路由 | 说明 |
| --- | --- |
| `POST /bot/webhook/<WEBHOOK_SECRET>` | Telegram webhook，同时校验路径和 `X-Telegram-Bot-Api-Secret-Token` |
| `GET /bot/setup?token=<SETUP_TOKEN>` | 设置 webhook（顺带清掉残留 scope 的命令并同步命令菜单） |
| `GET /bot/tgfiles/*` | Telegram 文件代理，供 `/soutu` 生成识图链接 |
| `POST /bot/cron/rss?token=<SETUP_TOKEN>` | 手动触发一次 RSS 检查 |

`allowed_updates` 目前是 `message` / `callback_query` / `chat_member`。大群里「用户加入」不再走 `message.new_chat_members`，而是 `chat_member`，漏订阅会影响加群验证。

**功能**

- 新成员进群立即禁言，发欢迎语和私聊深链；私聊随机抽一道河南师范大学题目，4 个按钮作答。答对解禁，答错或超时后作答会被移出群聊；一直不答保持禁言，管理员可用 `/unban` 解除。
- 群消息只检查**发送者本人**的个人头像：没头像会先删除这条消息再在群里 `@` 提醒，累计三次提醒移出群聊，通知带「解除警告 / 解除封禁 / 踢出群聊」按钮；消息正文、引用内容和通过 inline 机器人发送的消息，连同昵称/用户名由同一个 clef 判定一起看，任一违规即先删除消息再走三次警告流程。
- 本地关键词黑名单（博彩、代考、刷单等违规词）命中后删除消息并警告，累计三次封禁。
- 管理员回复消息后使用 `/ban [分钟]` 禁言、`/banl` 或 `/kick` 踢出、`/unban` 解除。
- `/soutu` 回复图片识图；带追踪参数的链接自动清理。
- 关键词黑名单在 `apps/bot/src/config.ts`；题目在 `apps/bot/src/config/questions.ts`。

<details>
<summary><b>AI 聊天：模型、判定与输出协议</b></summary>

- 主模型 `@cf/qwen/qwen3.8-27b`，用 Vercel AI SDK（`ai`）+ `workers-ai-provider` 直接走 `AI` 绑定，不依赖 Workers 专属的 `agents`。
- 私聊、@机器人、回复机器人直接回复，不再看关键词；其余群消息用 `@cf/cloudflare/clef-omni`（AI SDK `experimental_decide` + decision model 适配器）一次判断两件事：
  - 要不要让奶龙插话（instruction 里带人设，能认出语音转写的同音字写法）；
  - 是否违规（博彩、病毒/钓鱼、诈骗、刷屏等；广告和 R18 允许）。用 `choice` 在「真实违规 / 玩梗 / 提醒曝光 / 正常」里选一个，只有「真实违规」才处置；反讽、夸张段子、黑色幽默和「大家小心」这类提醒不会被当成广告或违规。判定同时看消息正文（含引用内容和 via inline 机器人的消息）和发送者的昵称/用户名。
- decision 的 state 是消息数组：历史每条消息一个 part，最后一条带「候选消息」标记的才是判断对象，结合上下文但只判这一条。
- 违规走三次警告制：前两次删除消息并警告，第 3 次起封禁；通知里用 spoiler 引用原消息内容，并挂「解除警告 / 解除封禁」按钮（仅管理员可用）。
- 前提是群在白名单里、发送者是真人；私聊只对白名单群成员开放 AI。
- 群友消息一行一条纯文本（`[MM-DD HH:mm] [群 群名] 昵称[身份](用户ID,#消息ID) 回复 昵称(用户ID,#被回复ID): 正文`），机器人自己的历史回复只存正文，不带行头。
- 输出协议只保留 `<msg:break>`（分多条）和 `<sticker>emoji</sticker>`（表情），正文其余部分是纯 Markdown、真换行（后期处理，不是工具）。
- 私聊用 `@grammyjs/stream` 的 rich markdown draft 流式输出，群聊用 rich message（Markdown）edit 流；同群消息并发处理，不做串行；`@grammyjs/auto-retry` 处理 429/5xx。
- 命令菜单由 `bun run bot:webhook` 在设置 webhook 时同步，运行时不再每次初始化都调用 `setMyCommands`。
- 工具只有 `wttr.in` 天气、pagemd 读网页、长期记忆读写；`env.AI.toMarkdown` 转附件，`AI_CAPABILITIES` 声明能处理 `text/image/document/audio/video`，未声明的模态回退成文字占位；打开 `audio` 后语音消息会先用 Whisper 转写成文字（转写发生在决策之前，喊奶龙也能触发回复）。
- 系统提示词固定不变，时间/记忆/表情表放在最后一条消息之后；历史 append-only，只有最后一条消息超过阈值时才压缩，保证前面的前缀稳定并命中 prompt cache。

</details>

**普通变量（非密钥）**

都在 `wrangler.jsonc` 的 `vars` 里：

```sh
BOT_USERNAME / ALLOWED_CHATS
RSS_FEEDS           # k1=v1,k2=v2，例如 教务通知=https://...
NOTIFY_CHATS        # v1,v2,v3，RSS 推送 + 站点通知共用，例如 -1001918752754,-1004957193457
BAN_DURATION_SECONDS / VERIFY_TIMEOUT_SECONDS
AI_MODEL / AI_TRIAGE_MODEL / AI_TRIAGE_THRESHOLD / AI_CONTEXT_TOKEN_LIMIT
AI_MEMORY_LIMIT / AI_REASONING
AI_CAPABILITIES / STICKER_SET / TURNSTILE_HOSTNAMES
```

改完 `wrangler.jsonc` 后重新生成绑定类型（会写到 `worker-configuration.d.ts`）：

```sh
bun run cf:typegen
```

**Secrets** 只在 Pages → Settings → Variables and Secrets 配置：

```sh
BOT_TOKEN=            # 先去 BotFather revoke 旧 token
WEBHOOK_SECRET=       # 同时用于 webhook 路径和请求头
SETUP_TOKEN=          # /bot/setup 和 /bot/cron/rss 的令牌
TURNSTILE_SECRET_KEY= # Turnstile widget 的 secret
```

本地只把这些 secrets（以及 `BOT_URL` 等脚本变量）写进仓库根目录的 `.env`（不要提交），完整示例见 `.env.example`。部署后在浏览器打开：

```sh
https://<你的域名>/bot/setup?token=<SETUP_TOKEN>
```

> 机器人必须是群管理员，并拥有删除消息、封禁用户、限制成员权限。Pages 没有 Cron Trigger，RSS 检查在每次 webhook 时用 `waitUntil` 机会式执行，并由 `bot_meta` 做 10 分钟节流。

**本地调试（两种路由，别搞混）**

```sh
# 1) 本地全链路（推荐）：本地 wrangler + 本地 D1 + 本地日志
bun run dev:bot            # = dev:api + bot:poll:local，一条命令全起来
# 或者拆成两个终端：
bun run dev:api            # wrangler pages dev，8788，读根目录 .env
bun run bot:poll:local     # 长轮询 → 转发到 http://localhost:8788

# 2) 只验证线上逻辑（本地看不到日志，且会顶掉线上 webhook）
bun run bot:poll           # 转发到 .env 里的 BOT_URL（默认 https://hackhtu.pages.dev）

# webhook 管理（默认作用于 BOT_URL，可用 --url 覆盖）
bun run bot:webhook
bun --env-file .env apps/bot/scripts/webhook.ts --url http://localhost:8788
bun --env-file .env apps/bot/scripts/webhook.ts --delete
```

`bot:poll*` 会先删除 webhook，再把 `getUpdates` 拿到的 update 转发到 `POST <BOT_URL>/bot/webhook/<WEBHOOK_SECRET>`，所以仍然走正常的 Hono + D1 逻辑。**测完记得 `bun run bot:webhook` 把线上 webhook 装回去，否则线上 bot 一直收不到消息。**

日志在 `apps/bot/src/lib/log.ts`，`LOG_LEVEL=debug` 时每次 Telegram API 调用都会打一条；默认（`info`）只打 update 收/发、路由决策、RSS、错误。

`.env` 会被 Bun（`--env-file`）和 Wrangler（`--env-file`）分别读取，且**会覆盖 `wrangler.jsonc` 里的同名 `vars`** —— 本地想让某个群可测时，直接在 `.env` 里写 `ALLOWED_CHATS=@HackHTU,@HackHTUDEV,<群ID>` 即可，不必改 `wrangler.jsonc`。默认只响应 `@HackHTU` 和 `@HackHTUDEV` 两个群；要临时放开某个群，把它加进 `ALLOWED_CHATS`。

本地 D1 是空库时 bot 会报 `no such table: ...`，先跑一次迁移（幂等，可重复执行）：

```sh
bun run d1:migrate:local
```

## 部署

| 项             | 值              |
| -------------- | --------------- |
| 构建命令       | `bun run build` |
| 输出目录       | `apps/web/dist` |
| Root directory | 仓库根目录 `/`  |

Vite 只构建前端，`functions/` 不会出现在 `apps/web/dist` 里。这是 Cloudflare Pages 的设计：Functions 由 Wrangler 在 `pages dev` / `pages deploy` 时单独发现并打包，输出目录只放静态资源。

因此：

- 手动部署必须在仓库根目录执行，否则 Wrangler 找不到 `functions/`：

  ```sh
  bun run deploy
  # 等价于 bun run build && wrangler pages deploy apps/web/dist
  ```

- `bun run deploy` 会先自动执行 `predeploy`：用 `BOT_TOKEN` 往 `NOTIFY_CHATS` 的群发一条「即将部署」（群 ID 缺省时从 `wrangler.jsonc` 读取）。通知失败只告警、不阻断部署；只看消息不发出去可用 `bun run predeploy -- --dry-run`。
- 部署前必须已经 commit（见开头「发布流程」），不要把未提交的工作区直接发上去。
- Git 集成部署时，Root directory 保持 `/`，构建命令 `bun run build`，输出目录 `apps/web/dist`。
- `functions/`、`apps/api/`、`apps/bot/`、`wrangler.jsonc` 必须提交到仓库，否则 Cloudflare 拉不到新的 API / bot 代码。

## 学校新闻

`/tools/news` 在浏览器里直接请求 `https://rss.htu.me/rss/htu/*`，源由 [HackHTU/rss](https://github.com/HackHTU/rss) 从学校官网和教务处解析生成，CORS 全开，不需要后端。

- 16 个栏目可选，默认订阅师大要闻、通知公告、教务通知、考务管理 4 个。
- 新闻列表、上次抓取时间和订阅源都保存在 localStorage。
- 超过 1 小时或手动点刷新时才重新抓取，单个源失败不影响其它源。
- 可以按时间（今天 / 1-3 天内 / 更早）或按栏目浏览。

## Turnstile 配置

评论区使用 Cloudflare Turnstile。创建 Turnstile widget 后，将站点 key 配置给前端，将 secret key 配置给 Pages Functions：

```sh
# 本地前端：和其他变量一起放在仓库根目录的 .env（不要提交，Vite 的 envDir 已指向根目录）
VITE_TURNSTILE_SITE_KEY=your_site_key

# secret 只放仓库根目录的 .env（不要提交）
TURNSTILE_SECRET_KEY=your_secret_key

# TURNSTILE_HOSTNAMES 是普通变量，改 wrangler.jsonc 的 vars：
# "TURNSTILE_HOSTNAMES": "localhost,127.0.0.1,hackhtu.pages.dev,www.hackhtu.pages.dev"

# Cloudflare Pages 生产环境：在 Pages Settings → Variables and Secrets 中配置
TURNSTILE_SECRET_KEY=your_secret_key
# 同时把 VITE_TURNSTILE_SITE_KEY 配置为构建环境变量
```

站点 key 可以公开在浏览器端；secret key 只能作为 Pages 的加密 secret 使用。Turnstile widget 的 action 需要允许 `comment`，并将项目部署域名加入 widget 的 Hostnames。
