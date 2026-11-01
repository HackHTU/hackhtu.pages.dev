import {
  ArrowsClockwiseIcon,
  DevicesIcon,
  PlusIcon,
  ShieldCheckIcon,
  TerminalWindowIcon,
  WarningIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { CodeBlock } from "./code-block";
import { commands, platforms } from "./data";

const features = [
  {
    title: "三个平台，各一个文件",
    description:
      "Windows 用 PowerShell，macOS 和 Linux 用系统 Bash，都不需要安装 Python、Node.js 或额外依赖。",
    icon: DevicesIcon,
  },
  {
    title: "全程在终端里完成",
    description:
      "账号、密码、运营商、连接状态、开机自启和清理存储都在一个 TUI 里，不用记参数。",
    icon: TerminalWindowIcon,
  },
  {
    title: "先连校园 WiFi 再登录",
    description:
      "未认证时会自动切到校园无线网（Htu_AuteWiFi 及其 2.4G 网络，公开网络免密码），已在上网时不会动当前连接。",
    icon: WifiHighIcon,
  },
  {
    title: "掉线自动重连",
    description:
      "开启开机自启后，脚本会定期检查连接，断线时自动重新认证，适合宿舍和实验室长期挂机。",
    icon: ArrowsClockwiseIcon,
  },
];

const faqs = [
  {
    q: "密码会被上传到网站吗",
    a: "不会。账号和密码只写入本机的配置文件，网站只提供脚本下载。配置文件里的密码是明文，请保护好自己的系统账户，不要分享配置或日志。",
  },
  {
    q: "为什么 Windows 提示无法运行脚本",
    a: "PowerShell 默认可能禁止执行本地脚本。按教程运行 Set-ExecutionPolicy -Scope Process Bypass，只对当前窗口生效，不会改动系统全局策略。",
  },
  {
    q: "移动脚本后自启失效了",
    a: "开机自启记录的是脚本的绝对路径。移动或删除脚本后，在原路径重新运行 install，或在 TUI 里重新开启开机自启。",
  },
  {
    q: "提示“没有拿到门户跳转地址”或一直卡在认证中",
    a: "先在脚本目录运行 doctor（Windows 为 .\\windows.ps1 doctor），它会逐条列出每个探测地址的 HTTP 状态和 portal.do 跳转结果。常见原因是浏览器没有先完成跳转、密码与网页登录不一致，或学校改了认证流程。学校的 auth 接口在密码错误时也可能返回 code=1，脚本以 check-only 和 quickauth.do 的结果为准。",
  },
  {
    q: "换电脑或改了 WiFi 名称会连不上吗",
    a: "脚本默认会尝试 Htu_AuteWiFi、Htu_AuteWiFi_2.4G、HTU_AutoWiFi、HTU_AutoWiFi_2.4G，比较时忽略大小写和下划线，所以名称小改不影响。也可以在 TUI 的「账号配置 → WiFi 设置」里改名或关闭自动连接。",
  },
  {
    q: "怎么彻底卸载",
    a: "先在 TUI 里关闭开机自启，再删除脚本文件。清理存储只删除账号配置和登录日志，不会关闭自启任务或服务。",
  },
];

export const FeatureSection = () => (
  <section className="px-6 py-16">
    <div className="mx-auto max-w-6xl">
      <h2 className="text-3xl font-semibold">为什么做成脚本</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.title}>
              <Icon size={24} weight="duotone" />
              <CardTitle className="mt-5">{feature.title}</CardTitle>
              <CardDescription className="mt-2">
                {feature.description}
              </CardDescription>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
);

export const InstallSection = () => (
  <section className="scroll-mt-24 px-6 py-16" id="install">
    <div className="mx-auto max-w-6xl">
      <p className="text-muted-foreground text-sm font-semibold">安装教程</p>
      <h2 className="mt-3 text-3xl font-semibold">选择你的系统</h2>
      <p className="text-muted-foreground mt-3 max-w-[620px] text-sm leading-6">
        下载后按对应步骤运行。第一次启动会在 TUI
        里引导填写账号和运营商，之后可以直接打开菜单登录。
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;

          return (
            <Card
              className="flex min-w-0 scroll-mt-24 flex-col"
              id={platform.key}
              key={platform.key}
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={22} weight="duotone" />
                </div>
                <div>
                  <CardTitle>{platform.name}</CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {platform.summary}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mt-4 text-sm leading-6">
                {platform.runtime}
              </p>

              <ol className="mt-5 space-y-3">
                {platform.steps.map((step, index) => (
                  <li className="flex gap-3" key={step.title}>
                    <span className="bg-secondary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 space-y-2">
                {platform.commands.map((command) => (
                  <CodeBlock
                    code={command.code}
                    key={command.label}
                    label={command.label}
                  />
                ))}
              </div>

              <p className="text-muted-foreground mt-auto pt-5 text-xs leading-5">
                {platform.note}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
);

export const CommandsSection = () => (
  <section className="px-6 py-16">
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div>
        <p className="text-muted-foreground text-sm font-semibold">命令参考</p>
        <h2 className="mt-3 text-3xl font-semibold">不开 TUI 也能用</h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          三个脚本的命令保持一致。不加参数时默认打开
          TUI；需要写进定时任务或快捷方式时，直接调用对应命令即可。
        </p>
        <div className="border-border bg-card mt-6 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold">
            配置文件位置
          </p>
          <p className="mt-2 font-mono text-xs leading-6">
            macOS / Linux：~/.config/htu-tui/config
          </p>
          <p className="font-mono text-xs leading-6">
            Windows：%APPDATA%\htu-tui\config
          </p>
        </div>
      </div>

      <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
        {commands.map((command) => (
          <div
            className="grid grid-cols-[auto_1fr] items-baseline gap-4 px-5 py-4"
            key={command.name}
          >
            <code className="bg-secondary rounded-md px-2 py-1 font-mono text-xs font-semibold">
              {command.name}
            </code>
            <p className="text-muted-foreground text-sm">
              {command.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const NotesSection = () => (
  <section className="px-6 py-16">
    <div className="border-border bg-card mx-auto max-w-6xl rounded-2xl border p-6 md:p-8">
      <div className="flex items-center gap-3">
        <WarningIcon className="text-destructive" size={22} weight="duotone" />
        <h2 className="text-2xl font-semibold">使用前需要知道</h2>
      </div>
      <div className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
        <p className="text-muted-foreground">
          脚本依赖学校当前的 Portal
          页面和认证接口。如果学校调整认证流程，脚本可能需要更新，届时请关注项目页面。
        </p>
        <p className="text-muted-foreground">
          请只用于本人有权使用的校园网账号。脚本不会绕过验证码、二次验证或学校的使用规则。
        </p>
        <p className="text-muted-foreground flex items-start gap-2">
          <ShieldCheckIcon className="mt-1 shrink-0" size={16} />
          TUI 会在登录后检测外网连通性；连接状态只在本机显示，不会上报。
        </p>
        <p className="text-muted-foreground flex items-start gap-2">
          <ShieldCheckIcon className="mt-1 shrink-0" size={16} />
          “清理存储”删除账号配置和登录日志，但保留开机自启设置，避免误删后忘记关闭后台任务。
        </p>
      </div>
    </div>
  </section>
);

export const FaqSection = () => (
  <section className="px-6 py-16">
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <h2 className="text-3xl font-semibold">常见问题</h2>
      <div className="border-border border-t">
        {faqs.map((item) => (
          <details className="border-border group border-b" key={item.q}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-semibold">{item.q}</h3>
              <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ease-out group-open:rotate-45">
                <PlusIcon size={14} />
              </span>
            </summary>
            <p className="text-muted-foreground max-w-[680px] pb-5 text-sm leading-6">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
);
