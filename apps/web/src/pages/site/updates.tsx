import { ContentPage } from "@/components/content-page";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const updates = [
  {
    date: "2026-11-02",
    version: "2.2",
    tag: "NEW",
    body: "美食地图上线：可在地图上浏览同学推荐的美食地点，提交新地点并留下评分与评价。新增评论、地点和评价都会实时推送到 Telegram 群，通知包含完整内容。",
  },
  {
    date: "2026-11-01",
    version: "2.1",
    tag: "NEW",
    body: "校园网一键登录脚本上线：Windows、macOS、Linux 三端终端界面，未认证时自动连接校园 WiFi，断线自动重连。奶龙 AI 的聊天记录补上每条消息的会话、身份与回复对象。站点重写元数据、页脚加入 GitHub 入口，并开源到 github.com/HackHTU/hackhtu.pages.dev。",
  },
  {
    date: "2026-05-06",
    version: "2.0",
    tag: "NEW",
    body: "课程评价查询与学校新闻上线：可查往年校选课、留下真实评价，官网与教务处的消息按栏目汇总。",
  },
  {
    date: "2025-06-28",
    version: "1.3",
    tag: "NEW",
    body: "匿名评论区、请假条生成器和跨平台位置模拟教程陆续完善。",
  },
  {
    date: "2025-03-26",
    version: "1.2.1",
    tag: "BUG FIX",
    body: "维护更新：修复若干已知问题，调整页面样式和移动端体验。",
  },
  {
    date: "2025-03-14",
    version: "1.2",
    tag: "NEW",
    body: "全新版本上线：首页与工具导航重做，站点整体改版。",
  },
  {
    date: "2025-02-17",
    version: "1.1",
    tag: "NEW",
    body: "站点改用 Vite + React + Cloudflare Pages 重新搭建，为后续工具打底。",
  },
  {
    date: "2024-08-24",
    version: "1.0",
    tag: "NEW",
    body: "新增复习资料和在线支持。合并保修信息工具，更新使用教程，并修复若干已知问题。",
  },
  {
    date: "2024-08-21",
    version: "0.3",
    tag: "NEW",
    body: "问卷调查结束，一共收到 39 份问卷和 18 条建议。呼声最高的是交流论坛和期末复习资料整理。",
  },
  {
    date: "2024-08-20",
    version: "0.2",
    tag: "NEW",
    body: "添加问卷调查，欢迎匿名告诉我们未来的方向。",
  },
  {
    date: "2024-08-20",
    version: "0.1",
    tag: "NEW",
    body: "增加评论服务，匿名评论经审核后通过。",
  },
  {
    date: "2024-07-12",
    version: "0.03",
    tag: "NEW & BUG FIX",
    body: "更新全局样式，确定扁平化响应式设计，补充 SEO 元数据，并修复图片不居中。",
  },
  {
    date: "2024-07-12",
    version: "0.02",
    tag: "NEW",
    body: "更新签到全攻略教程，目前包含位置签到说明。",
  },
  {
    date: "2024-07-06",
    version: "0.01",
    tag: "NEW",
    body: "河师大请假条生成器上线。请勿滥用，使用后果自负。",
  },
];

export const UpdatesPage = () => (
  <ContentPage
    kicker="日志"
    title="更新记录"
    description="Hack HTU 从 2024 年 7 月开始的公开更新。"
  >
    <div className="grid gap-4">
      {updates.map((item) => (
        <Card key={`${item.version}-${item.date}`}>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>版本 {item.version}</CardTitle>
            <span className="bg-secondary rounded-full px-3 py-1 text-xs font-semibold">
              {item.tag}
            </span>
            <span className="text-muted-foreground text-xs">{item.date}</span>
          </div>
          <CardDescription className="mt-4">{item.body}</CardDescription>
        </Card>
      ))}
    </div>
  </ContentPage>
);
