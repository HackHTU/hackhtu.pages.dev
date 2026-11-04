<div align="center">

<img src="apps/web/public/favicons/android-icon-192x192.png" alt="Hack HTU" width="88" height="88" />

# Hack HTU

**河师大学生工具站 · hackhtu.pages.dev**

查课程评价、看学校新闻、做请假条、学位置模拟、登录校园网、匿名留言 —— 六个工具，一个站，打开就能用。

[![在线访问](https://img.shields.io/badge/hackhtu.pages.dev-1e3fd8?style=for-the-badge&labelColor=000000&logo=cloudflare&logoColor=white)](https://hackhtu.pages.dev) [![Telegram 群组](https://img.shields.io/badge/Telegram-群组-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/+UkcPLjqd8y9mYmU1) [![GitHub](https://img.shields.io/badge/GitHub-HackHTU-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/HackHTU)

![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Hono](https://img.shields.io/badge/Hono-4-E36002?style=flat-square&logo=hono&logoColor=white) ![D1](https://img.shields.io/badge/Cloudflare-D1%20%2B%20Workers%20AI-F38020?style=flat-square&logo=cloudflare&logoColor=white) ![Bun](https://img.shields.io/badge/Bun-FBF0DF?style=flat-square&logo=bun&logoColor=black)

</div>

---

Cloudflare Pages 站点。前端是 Vite + React，接口是 Hono Pages Function，站点和 Telegram bot 共用同一个 D1（`HackHTUDB`）。没有注册、没有账号，所有工具打开即用。

## 站点工具

| 工具 | 路径 | 说明 |
| --- | --- | --- |
| 📚 课程评价查询 | `/tools/class-recommend` | 查往年校选课，留下这学期的真实评价 |
| 📰 学校新闻 | `/tools/news` | 汇总官网与教务处的消息，按时间或栏目浏览 |
| 🌐 校园网一键登录 | `/tools/campus-login` | Windows / macOS / Linux 终端登录脚本，自动识别平台下载 |
| 📝 请假条生成器 | `/tools/leave-slip` | 按学校格式生成请假条，可导出成图片 |
| 📍 跨平台位置模拟教程 | `/tools/location-simulation-tutorial` | 网页、Android、iOS 的模拟定位方法，另附学习通签到说明 |
| 🗺️ 校园生活地图 | `/tools/life-map` | 三个校区的美食、打印、快递、自习室和维修点，打分评价 |
| 💬 校园树洞墙 | `/pages/wall` | 匿名发帖，标签、点赞、一级评论、搜索和筛选，不用登录 |
| 📬 意见反馈 | `/pages/comment` | 匿名反馈使用问题或建议，不用登录 |

> 旧链接 `/tools/fake-notebook` 会自动跳转到 `/tools/leave-slip`；`/tools/food-map` 会自动跳转到 `/tools/life-map`。

## 快速开始

```sh
cp .env.example .env   # 填入本地 secrets，所有 dev 都读这一个文件
bun install
bun run dev
```

- 前端 HMR：http://localhost:5173
- API / D1：http://localhost:8788

## 开发与运维

技术栈、目录结构、常用脚本、D1 迁移、Telegram bot、部署流程和 Turnstile 配置都在 [AGENTS.md](./AGENTS.md)。

> 发布约定：**先 commit，再 deploy**。

---

<div align="center">

由河师大学生自己维护，和学校教务处没有官方关系。

<a href="https://hackhtu.pages.dev">hackhtu.pages.dev</a> · <a href="https://github.com/HackHTU">GitHub</a> · <a href="https://t.me/+UkcPLjqd8y9mYmU1">Telegram</a>

</div>
