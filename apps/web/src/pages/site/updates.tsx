import { ContentPage } from "@/components/content-page";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const updates = [
  {
    version: "1.0",
    tag: "NEW",
    body: "新增复习资料和在线支持。合并保修信息工具，更新使用教程，并修复若干已知问题。",
  },
  {
    version: "0.3",
    tag: "NEW",
    body: "问卷调查结束，一共收到 39 份问卷和 18 条建议。呼声最高的是交流论坛和期末复习资料整理。",
  },
  {
    version: "0.2",
    tag: "NEW",
    body: "添加问卷调查，欢迎匿名告诉我们未来的方向。",
  },
  {
    version: "0.1",
    tag: "NEW",
    body: "增加评论服务，匿名评论经审核后通过。",
  },
  {
    version: "0.03",
    tag: "NEW & BUG FIX",
    body: "更新全局样式，确定扁平化响应式设计，补充 SEO 元数据，并修复图片不居中。",
  },
  {
    version: "0.02",
    tag: "NEW",
    body: "更新签到全攻略教程，目前包含位置签到说明。",
  },
  {
    version: "0.01",
    tag: "NEW",
    body: "河师大请假条生成器上线。请勿滥用，使用后果自负。",
  },
];

export const UpdatesPage = () => (
  <ContentPage
    kicker="日志"
    title="更新记录"
    description="Hack HTU 从 2024 年 9 月开始的公开更新。"
  >
    <div className="grid gap-4">
      {updates.map((item) => (
        <Card key={item.version}>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>版本 {item.version}</CardTitle>
            <span className="bg-secondary rounded-full px-3 py-1 text-xs font-semibold">
              {item.tag}
            </span>
          </div>
          <CardDescription className="mt-4">{item.body}</CardDescription>
        </Card>
      ))}
    </div>
  </ContentPage>
);
