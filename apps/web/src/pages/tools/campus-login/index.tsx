import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

import { DownloadPanel } from "./download-panel";
import {
  CommandsSection,
  FaqSection,
  FeatureSection,
  InstallSection,
  NotesSection,
} from "./sections";

const TerminalPreview = () => (
  <div className="bg-primary text-primary-foreground rounded-2xl p-5 font-mono text-xs leading-6">
    <div className="mb-4 flex gap-1.5">
      <span className="bg-primary-foreground/25 size-2.5 rounded-full" />
      <span className="bg-primary-foreground/25 size-2.5 rounded-full" />
      <span className="bg-primary-foreground/25 size-2.5 rounded-full" />
    </div>
    <p className="text-primary-foreground/45">
      HackHTU · HTU 校园网一键登录脚本 v1.1.6
    </p>
    <p className="text-primary-foreground/45">https://hackhtu.pages.dev</p>
    <p className="mt-3">❯ 立即登录</p>
    <p className="text-primary-foreground/60">　账号配置</p>
    <p className="text-primary-foreground/60">　网络诊断</p>
    <p className="text-primary-foreground/60">　连接状态</p>
    <p className="text-primary-foreground/60">　开机自启</p>
    <p className="text-primary-foreground/60">　清理存储</p>
    <p className="text-primary-foreground/45 mt-3">
      ↑↓ 移动　Enter 确认　q 退出
    </p>
  </div>
);

const HeroSection = () => (
  <section className="px-6 pt-24 pb-16">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
      <div className="max-w-[640px]">
        <p className="text-muted-foreground text-sm font-semibold">
          校园网工具
        </p>
        {/* oxlint-disable-next-line shadcn/no-raw-colors -- bg-gradient-to-r 是渐变工具类，不是颜色 token */}
        <h1 className="from-foreground to-muted-foreground mt-4 bg-gradient-to-r bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
          校园网一键登录脚本
        </h1>
        <p className="text-muted-foreground mt-6 text-lg leading-8">
          Windows、macOS、Linux
          三个版本，下载后一条命令打开终端界面，配置一次账号和运营商，之后登录、查看状态、断线重连都在这里完成。
        </p>
        <div className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
          {["Windows", "macOS", "Linux", "纯 TUI"].map((label) => (
            <span className="bg-secondary rounded-full px-4 py-2" key={label}>
              {label}
            </span>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-sm leading-6">
          不需要 Python 或 Node.js。脚本只依赖系统自带运行时，下载后即可运行。
        </p>
      </div>

      <div className="space-y-4">
        <DownloadPanel />
        <TerminalPreview />
      </div>
    </div>
  </section>
);

const CtaSection = () => (
  <section className="px-6 py-24">
    <Reveal className="mx-auto max-w-[680px] text-center">
      <h2 className="text-4xl font-semibold text-pretty">
        配置一次，之后一键登录
      </h2>
      <p className="text-muted-foreground mt-4 text-base leading-7">
        下载对应平台的脚本，按教程运行一次。以后打开终端输入脚本名，就能进入登录菜单。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <a href="#install">查看安装教程</a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    </Reveal>
  </section>
);

export const CampusLoginPage = () => (
  <main>
    <HeroSection />
    <FeatureSection />
    <InstallSection />
    <CommandsSection />
    <NotesSection />
    <FaqSection />
    <CtaSection />
  </main>
);
