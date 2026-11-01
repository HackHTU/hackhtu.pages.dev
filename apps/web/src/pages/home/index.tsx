import { PlusIcon } from "@phosphor-icons/react";

import { PwaInstall } from "@/components/pwa-install";
import { Reveal } from "@/components/reveal";
import { TaglineReveal } from "@/components/tagline-reveal";

import { HomeHero } from "./hero";
import { ToolCards } from "./tool-cards";
import { HomeWordmark } from "./wordmark";

const steps = [
  {
    title: "选一个工具",
    description:
      "首页六个入口按用途分开：查课、看新闻、开假条、学定位、登录校园网、留言。",
  },
  {
    title: "按提示填写",
    description: "课程名、假条信息这些直接在页面上填，不用账号，也不上传资料。",
  },
  {
    title: "结果当场出现",
    description: "评价立刻挂在课程下，假条能导出成图片，留言发完就能看到。",
  },
];

const faqs = [
  {
    q: "这个站是学校官方的吗",
    a: "不是。Hack HTU 由河师大学生自己维护，和学校教务处没有官方关系。",
  },
  {
    q: "用起来要登录吗",
    a: "不用。查课、写评价、做假条、看教程和留言都不需要账号。",
  },
  {
    q: "课程评价从哪来",
    a: "课程表来自往年校选课的公开信息，评价由同学自愿提交，发出去后会立刻出现在对应课程下。",
  },
  {
    q: "假条里的信息会上传吗",
    a: "不会。姓名、学号和请假内容只存在你自己的浏览器里，生成的图片也只有你保存或转发后才会离开这台设备。",
  },
  {
    q: "校园网登录脚本安全吗",
    a: "脚本只在你自己的电脑上运行，账号和密码写入本机配置文件，不会上传到本站。配置文件里是明文密码，请不要分享配置或日志。",
  },
  {
    q: "能装到手机桌面吗",
    a: "能。本站是 PWA，iOS 用 Safari 的分享菜单加到主屏幕，Android 在浏览器菜单里选安装应用，之后打开和 App 一样。",
  },
  {
    q: "评价写错了能改吗",
    a: "目前不能自己改，也没有删除入口，提交之前多检查一遍。",
  },
  {
    q: "想一起做点东西",
    a: "欢迎。加入我们页面写了目前在找的方向，群里也可以直接聊。",
  },
];

export const HomePage = () => (
  <main>
    <HomeHero />
    <HomeWordmark />
    <section className="px-6 py-16 md:py-24">
      <TaglineReveal />
    </section>
    <ToolCards />
    <section className="px-6 py-16">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">怎么开始</h2>
        <ol className="border-border divide-border mt-8 grid divide-y overflow-hidden rounded-2xl border md:grid-cols-3 md:divide-x md:divide-y-0">
          {steps.map((step, index) => (
            <li key={step.title} className="p-8">
              <span className="border-border text-muted-foreground flex size-8 items-center justify-center rounded-full border font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-6 text-xl font-semibold">{step.title}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
    <section className="px-6 py-16">
      <Reveal className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <h2 className="text-3xl font-semibold">常见问题</h2>
        </div>
        <div className="border-border border-t">
          {faqs.map((item) => (
            <details key={item.q} className="border-border group border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-out group-open:rotate-45">
                  <PlusIcon size={14} />
                </span>
              </summary>
              <p className="text-muted-foreground max-w-[680px] pb-5 text-sm">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
    <section className="px-6 py-24">
      <Reveal className="mx-auto max-w-6xl">
        <div className="bg-primary text-primary-foreground rounded-2xl px-8 py-16 text-center md:py-20">
          <h2 className="mx-auto max-w-[680px] text-4xl font-semibold text-pretty">
            安装桌面
          </h2>
          <p className="text-primary-foreground/70 mx-auto mt-4 max-w-[680px] text-base text-pretty">
            Hack HTU 是
            PWA，不用去应用商店。装好后六个工具收在一个图标里，打开和普通 App
            一样。
          </p>
          <div className="mt-8">
            <PwaInstall />
          </div>
        </div>
      </Reveal>
    </section>
  </main>
);
