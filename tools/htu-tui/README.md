# HTU 校园网 TUI

面向河南师范大学校园网的纯终端登录工具。Windows、macOS、Linux 各使用一个系统自带运行时脚本，不需要安装 Python、Node.js 或额外包。TUI 页面展示 HackHTU 品牌，并在支持 OSC 8 的终端中提供可点击的官网链接 `https://hackhtu.pages.dev`。

## 支持平台

| 平台 | 文件 | 运行环境 |
| --- | --- | --- |
| Windows | `windows.ps1` | Windows PowerShell 5.1、系统 curl.exe、当前用户启动项 |
| macOS | `macos.sh` | 系统 Bash、curl、LaunchAgent |
| Linux | `linux.sh` | Bash、curl、systemd user |

## 使用

先将本目录复制到希望长期保留的位置。自启配置会记录脚本的绝对路径，移动或删除脚本后需重新安装自启。

### Windows

在 PowerShell 中运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\windows.ps1
```

如果系统策略不允许脚本执行，可在当前用户范围调整执行策略，或继续使用上面的进程级设置。脚本使用 Windows 10 1803+ 自带的 `curl.exe` 发请求；开机自启写入当前用户的登录启动项，不需要管理员权限。

### macOS

```bash
chmod +x ./macos.sh
./macos.sh
```

若从网络下载后被 Gatekeeper 隔离，可在“系统设置 → 隐私与安全性”允许该文件，或仅在确认文件来源可信后执行 `xattr -d com.apple.quarantine ./macos.sh`。

### Linux

```bash
chmod +x ./linux.sh
./linux.sh
```

Linux 自启由 systemd user unit 管理。若希望用户尚未登录时服务也能启动，可按需启用 linger：

```bash
loginctl enable-linger "$USER"
```

这会让该用户的 systemd 服务在登录会话之外运行；不需要此行为时无需执行。

## TUI 与命令

三个脚本的命令保持一致：

```text
tui        打开交互界面（默认）
login      尝试登录一次
watch      每分钟检查连接，断线后自动登录
status     输出连接、账号和自启状态
doctor     网络诊断：逐条探测跳转地址、门户页面和认证接口（含 WiFi 状态）
install    安装并启动开机自启
uninstall  停止并移除开机自启
```

主菜单的“清理存储”会在二次确认后删除账号配置和登录日志；不会移除开机自启任务或服务。

例如：`./linux.sh status`、`./macos.sh install`、`./windows.ps1 login`。

TUI 可配置账号、密码和运营商（移动 `@yd`、联通 `@lt`、电信 `@dx`、校园直连 `@hsd`），查看连接状态并切换自启。Linux/macOS 的账号配置位于 `~/.config/htu-tui/config`（遵循 `XDG_CONFIG_HOME`），脚本会尽量将权限设为仅当前用户可读写；Windows 位于 `%APPDATA%\htu-tui\config`，并尝试限制为当前 Windows 用户访问。配置含明文密码，请保护好当前系统账户，不要分享配置文件或日志。

## 校园 WiFi 自动连接

未认证时脚本会先确认自己连的是校园 WiFi，再走门户登录；默认开启，可在 TUI「账号配置 → WiFi 设置」里关闭或改名。公开网络不需要密码，如果学校换成加密网络，可在配置里补 `wifi_password=密码`。

| 平台    | 连网方式                                                   |
| ------- | ---------------------------------------------------------- |
| Windows | `netsh wlan connect`；没有对应配置文件时按公开网络自动生成 |
| macOS   | `networksetup -setairportnetwork`                          |
| Linux   | `nmcli device wifi connect`（需要 NetworkManager）         |

默认候选名称是 `Htu_AuteWiFi`、`Htu_AuteWiFi_2.4G`、`HTU_AutoWiFi`、`HTU_AutoWiFi_2.4G`。广播名称可能改大小写、加下划线或后缀，所以比较时会先去掉所有非字母数字：`Htu_AuteWiFi`、`htu-autowifi`、`HTU_AutoWiFi_2.4G` 视为同一个校园网。自定义列表写进 `wifi_names`（逗号分隔）覆盖默认值。

只有在外网不可达时才会切换网络，正在上网时不会动当前连接。

## 登录流程与限制

登录时先访问网关地址和 `http://www.qq.com/` 这类普通网页，捕获未认证状态下被 302 到的 `portal.do?wlanuserip=...` 地址（相对地址会自动补成绝对地址）。Portal 页面通过 `document.write` 注入 `./front/js/common.js`（并带 `<base href>`），脚本从中读取 `API`、`authApiUrl`、`checkApiUrl` 和 `authSchoolCodes`。未选择运营商时与网页一致，默认校园直连 `@hsd`，curl 直连必须带上 `operatorSuffix=@hsd`。学校的 `auth` 接口在密码错误时仍可能返回 `code=1`，真正校验密码的是 `check-only`；通过后再用这次跳转的查询参数请求 `quickauth.do`。请求一律直连、不走系统代理。动态发现失败时使用参考项目提供的内置接口和 campusCode 兜底，但没有 `portal.do` 的查询参数就无法完成 `quickauth.do`，此时会直接提示“没有拿到门户跳转地址”，而不是笼统地说外网不可达。认证成功后最多等待约 15 秒再判定外网连通性。

登录失败时先运行 `./macos.sh doctor`（Linux 为 `./linux.sh doctor`），日志会逐条列出每个探测地址的 HTTP 状态和 `portal.do` 跳转结果，可直接看出是外网不通、门户没跳转，还是认证接口取不到。TUI 主菜单的“网络诊断”是同一个功能。

本工具依赖学校当前 Portal 页面结构和接口行为；若学校变更认证协议，可能需要更新脚本。请仅用于本人有权使用的校园网账号。`watch` 与自启会持续在后台运行，可用 `uninstall` 关闭。

## 验证说明

macOS TUI 已用交互式终端验证；Linux/macOS shell 脚本通过 `bash -n` 语法检查，并用本地 mock 认证服务（相对 302、`<base href>`、`API` 拼接、`check-only`、`quickauth.do`）跑通完整登录链路。Windows 脚本已用 PowerShell 解析器检查，跳转地址解析（绝对、相对、`location.replace`）已单独验证；实际 Windows 启动项和 TUI 仍需在 Windows 实机复验。
