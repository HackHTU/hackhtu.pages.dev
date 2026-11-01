import { ContentPage } from "@/components/content-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const openings = [
  {
    work: "插画师 / 绘画爱好者",
    need: "找个人帮我画可爱的表情包，这个项目也可以拟人化。二创可以搞个白毛猫耳 jk。AI 绘画或会画画的都可以。",
    count: "不限",
  },
  {
    work: "管理",
    need: "偶尔看一眼有没有人发垃圾骚扰信息，然后删掉或封禁。",
    count: "少于 3",
  },
  {
    work: "计算机爱好者",
    need: "要求不提了，有兴趣就来。",
    count: "不限",
  },
  {
    work: "独立开发者",
    need: "对 Android / iOS 有兴趣，用 Kotlin / Swift 一起做项目。",
    count: "不限",
  },
  {
    work: "推广",
    need: "去贴吧狠狠引流。",
    count: "不限",
  },
  {
    work: "懂哥",
    need: "快毕业了，找个全栈 / 前端懂哥，等毕业了接管一下。",
    count: "1",
  },
];

export const JoinUsPage = () => (
  <ContentPage
    kicker="团队"
    title="加入我们"
    description="谁欲来者，随意而至。主要活动在 Telegram。"
  >
    <section>
      <h2 className="text-2xl font-semibold">成员需求</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {openings.map((item) => (
          <Card key={item.work}>
            <CardTitle>{item.work}</CardTitle>
            <CardDescription className="mt-3">{item.need}</CardDescription>
            <p className="text-muted-foreground mt-4 text-sm">
              人数：{item.count}
            </p>
          </Card>
        ))}
      </div>
    </section>

    <section className="mt-16 max-w-[680px]">
      <p className="text-muted-foreground text-base">
        未来想做成社区环境，方向会公开征集。有人来就心满意足。想加入的话，可以在群里当管理，自己定一个头衔。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a
            href="https://t.me/+UkcPLjqd8y9mYmU1"
            target="_blank"
            rel="noreferrer"
          >
            加入电报群组
          </a>
        </Button>
      </div>
    </section>
  </ContentPage>
);
