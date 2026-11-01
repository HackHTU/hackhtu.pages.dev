import {
  CheckCircleIcon,
  CompassIcon,
  GlobeHemisphereWestIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const HeroSection = () => (
  <section className="px-6 pt-24 pb-20">
    <div className="mx-auto max-w-6xl">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
        <div className="max-w-[680px]">
          <p className="text-muted-foreground text-sm font-semibold">
            使用指南
          </p>
          {/* oxlint-disable-next-line shadcn/no-raw-colors -- bg-gradient-to-r 是渐变工具类，不是颜色 token */}
          <h1 className="from-foreground to-muted-foreground mt-4 bg-gradient-to-r bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
            跨平台位置模拟教程
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            网页、Android、iOS
            三种定位测试路径。这不是单独的学习通签到项目，而是一份按平台整理的位置模拟教程。下面分别介绍
            Chromium 浏览器、Android 和 iOS / iPadOS
            的工具入口、操作步骤、验证方法与恢复方式；学习通签到只是其中一个需要先读清规则的使用场景。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="#web"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              网页定位
            </a>
            <a
              href="#android"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              Android 定位
            </a>
            <a
              href="#ios"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              iOS 定位
            </a>
            <a
              href="#chaoxing"
              className="bg-secondary hover:bg-secondary/70 rounded-full px-4 py-2 transition-colors"
            >
              学习通特殊签到
            </a>
          </div>
        </div>
        <div className="border-border bg-card rounded-2xl border p-6">
          <div className="bg-secondary flex min-h-56 items-center justify-center rounded-xl px-8 text-center">
            <div>
              <GlobeHemisphereWestIcon
                className="mx-auto"
                size={56}
                weight="duotone"
              />
              <p className="mt-4 text-sm font-semibold">
                网页、Android、iOS / iPadOS
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                按平台选择对应的测试路径
              </p>
            </div>
          </div>
          <div className="text-muted-foreground mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-secondary rounded-xl p-4">
              选择平台
              <strong className="text-foreground mt-1 block">先判断</strong>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              位置测试
              <strong className="text-foreground mt-1 block">照步骤</strong>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              测试结束
              <strong className="text-foreground mt-1 block">要恢复</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Card>
          <CompassIcon size={24} weight="duotone" />
          <CardTitle className="mt-5">按平台查</CardTitle>
          <CardDescription className="mt-2">
            网页、Android 和 iOS 的权限、工具和恢复方式不一样。
          </CardDescription>
        </Card>
        <Card>
          <CheckCircleIcon size={24} weight="duotone" />
          <CardTitle className="mt-5">折叠阅读</CardTitle>
          <CardDescription className="mt-2">
            点击对应平台展开详细步骤，其他内容保持收起。
          </CardDescription>
        </Card>
        <Card>
          <ShieldCheckIcon size={24} weight="duotone" />
          <CardTitle className="mt-5">只做授权测试</CardTitle>
          <CardDescription className="mt-2">
            不代签，不伪造现场，不绕过验证码、人脸识别或学校规则。
          </CardDescription>
        </Card>
      </div>
    </div>
  </section>
);
