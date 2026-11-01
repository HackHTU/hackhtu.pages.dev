import { InfoIcon } from "@phosphor-icons/react";

import { Reveal } from "@/components/reveal";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { signTypes } from "./data";
import { Steps } from "./ui";

export const PlatformOverviewSection = () => (
  <section className="px-6 py-16">
    <Reveal className="mx-auto max-w-6xl">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-muted-foreground text-sm font-semibold">
            使用场景 · 学习通签到
          </p>
          <h2 className="mt-4 text-3xl font-semibold">
            学习通是一个场景，不是全部内容
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-7">
            学习通签到本身有多种活动类型。先确认教师发布的规则，再选择对应设备正常完成签到。下面的位置模拟面板用于理解浏览器或设备如何向自己的网页与应用提供测试坐标，两者不要混为一谈。
          </p>
          <div className="border-border mt-8 rounded-2xl border p-5">
            <p className="text-sm font-semibold">开始前先确认</p>
            <div className="mt-4">
              <Steps
                steps={[
                  {
                    title: "确认活动",
                    text: "确认课程、活动名称和有效时间，没有开始或已经结束的活动无法提交。",
                  },
                  {
                    title: "确认类型",
                    text: "看清是普通、位置、拍照、二维码、手势还是签到码，不要把不同类型混为一谈。",
                  },
                  {
                    title: "确认边界",
                    text: "课程考勤按教师要求到场完成。位置模拟只用于自己的网页、应用和获得授权的测试环境。",
                  },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {signTypes.map((item) => (
            <Card key={item.title}>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="mt-3">{item.text}</CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </Reveal>
  </section>
);

export const IosSection = () => (
  <section className="px-6 py-16">
    <Reveal className="mx-auto max-w-6xl">
      <div className="bg-secondary rounded-2xl p-6 md:p-8">
        <div className="flex gap-4">
          <InfoIcon className="mt-1 shrink-0" size={24} weight="duotone" />
          <div>
            <h2 className="text-xl font-semibold">怎样理解下面的模拟定位</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              每个面板都包含“前置条件、具体步骤、验证方式、恢复方式和相关项目”。网页定位只影响当前浏览器页面，Android
              和 iOS
              则涉及系统或设备测试。位置模拟不会自动让学习通签到成功，也不代表教师或学校允许改变考勤位置。
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
