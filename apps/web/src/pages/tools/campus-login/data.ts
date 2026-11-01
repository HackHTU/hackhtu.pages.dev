import {
  AppleLogoIcon,
  LinuxLogoIcon,
  WindowsLogoIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type PlatformKey = "windows" | "macos" | "linux";

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  file: string;
  href: string;
  icon: Icon;
  summary: string;
  runtime: string;
  steps: { title: string; text: string }[];
  commands: { label: string; code: string }[];
  note: string;
}

const downloadBase = "/downloads/htu-tui";

export const platforms: PlatformInfo[] = [
  {
    key: "windows",
    name: "Windows",
    file: "windows.ps1",
    href: `${downloadBase}/windows.ps1`,
    icon: WindowsLogoIcon,
    summary: "PowerShell 5.1 · 当前用户启动项",
    runtime:
      "Windows 10 / 11 自带的 PowerShell 5.1 即可运行，不需要安装 Python 或 Node.js。",
    steps: [
      {
        title: "保存脚本",
        text: "把 windows.ps1 放到一个长期保留的文件夹。移动脚本后，需要重新安装开机自启。",
      },
      {
        title: "允许当前窗口运行脚本",
        text: "打开 PowerShell，运行下面的命令。它只影响当前会话，不会修改系统执行策略。",
      },
      {
        title: "启动 TUI",
        text: "进入脚本所在目录后运行脚本，按提示填写账号、密码和运营商。",
      },
    ],
    commands: [
      {
        label: "允许当前会话运行脚本",
        code: "Set-ExecutionPolicy -Scope Process Bypass",
      },
      { label: "启动", code: ".\\windows.ps1" },
    ],
    note: "脚本使用 Windows 10 1803+ 自带的 curl.exe 发请求；开机自启写入当前用户的登录启动项，不需要管理员权限。",
  },
  {
    key: "macos",
    name: "macOS",
    file: "macos.sh",
    href: `${downloadBase}/macos.sh`,
    icon: AppleLogoIcon,
    summary: "系统 Bash · LaunchAgent",
    runtime: "使用 macOS 自带的 Bash 和 curl，不需要 Homebrew 或额外运行时。",
    steps: [
      {
        title: "保存并添加执行权限",
        text: "把 macos.sh 放到一个长期保留的文件夹，打开终端进入该目录，执行下面的命令。",
      },
      {
        title: "启动 TUI",
        text: "运行脚本后会出现终端界面，用方向键选择，按提示配置账号和运营商。",
      },
      {
        title: "按需开启开机自启",
        text: "在 TUI 里进入“开机自启”开启即可，登录后会自动保持连接。",
      },
    ],
    commands: [
      { label: "添加执行权限", code: "chmod +x ./macos.sh" },
      { label: "启动", code: "./macos.sh" },
    ],
    note: "如果浏览器给文件加上了隔离标记，可在“系统设置 → 隐私与安全性”中允许；确认来源可信后也可以运行 xattr -d com.apple.quarantine ./macos.sh。",
  },
  {
    key: "linux",
    name: "Linux",
    file: "linux.sh",
    href: `${downloadBase}/linux.sh`,
    icon: LinuxLogoIcon,
    summary: "Bash · systemd user",
    runtime: "需要 Bash、curl 和 systemd user。主流桌面发行版通常已经自带。",
    steps: [
      {
        title: "保存并添加执行权限",
        text: "把 linux.sh 放到一个长期保留的文件夹，打开终端进入该目录，执行下面的命令。",
      },
      {
        title: "启动 TUI",
        text: "运行脚本后会出现终端界面，用方向键选择，按提示配置账号和运营商。",
      },
      {
        title: "按需开启开机自启",
        text: "在 TUI 里进入“开机自启”开启。如果希望未登录系统时也能保持连接，可以再启用 linger。",
      },
    ],
    commands: [
      { label: "添加执行权限", code: "chmod +x ./linux.sh" },
      { label: "启动", code: "./linux.sh" },
      { label: "可选：未登录时也启动", code: 'loginctl enable-linger "$USER"' },
    ],
    note: "开启 linger 后，该用户的 systemd 服务会在登录会话之外运行。如果只需要登录后自启，不要执行这一条。",
  },
];

export const commands = [
  { name: "tui", description: "打开交互界面，默认命令" },
  { name: "login", description: "尝试登录一次" },
  { name: "watch", description: "每分钟检查连接，断线后自动登录" },
  { name: "status", description: "输出连接、账号和自启状态" },
  {
    name: "doctor",
    description: "网络诊断：逐条探测跳转地址、门户页面和认证接口",
  },
  { name: "install", description: "安装并启动开机自启" },
  { name: "uninstall", description: "停止并移除开机自启" },
];

export const detectPlatform = (): PlatformKey | null => {
  const ua = navigator.userAgent.toLowerCase();

  const isMobile =
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("ipad") ||
    (ua.includes("macintosh") && navigator.maxTouchPoints > 1);

  if (isMobile) {
    return null;
  }

  if (ua.includes("windows")) {
    return "windows";
  }

  if (ua.includes("mac os") || ua.includes("macintosh")) {
    return "macos";
  }

  if (ua.includes("linux") || ua.includes("x11")) {
    return "linux";
  }

  return null;
};
