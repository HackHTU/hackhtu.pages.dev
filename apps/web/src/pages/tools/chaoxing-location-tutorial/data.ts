export const imageBase = "/location-simulation/";

export const signTypes = [
  { title: "普通签到", text: "打开活动后直接提交，通常不需要定位或现场照片。" },
  {
    title: "位置签到",
    text: "学习通会读取设备或浏览器提供的位置。实际考勤应在教师要求的地点完成。",
  },
  {
    title: "拍照签到",
    text: "按活动要求拍摄现场照片，不要使用他人照片或伪造现场凭证。",
  },
  {
    title: "二维码、手势与签到码",
    text: "使用教师发布的实时信息完成活动。遇到异常先确认活动是否仍在有效时间内。",
  },
];

export const platformSources = [
  {
    name: "Chrome DevTools Sensors",
    detail:
      "Chromium 浏览器自带的网页定位调试工具。Chrome 和 Edge 都可以使用。",
    href: "https://developer.chrome.com/docs/devtools/sensors/",
  },
  {
    name: "影梭 GoGoGo",
    detail:
      "Android 模拟位置信息应用示例，使用前请查看项目说明和 Release 来源。",
    href: "https://github.com/ZCShou/GoGoGo",
  },
  {
    name: "爱思助手虚拟定位",
    detail:
      "iPhone 与 iPad 的桌面设备管理和位置测试途径，支持范围以当前版本为准。",
    href: "https://www.i4.cn/news_detail_54432.html",
  },
  {
    name: "GeoPort",
    detail:
      "面向授权 Apple 设备测试的桌面工具，项目说明覆盖 iOS 17 / 18 与 Windows / macOS。",
    href: "https://github.com/davesc63/GeoPort",
  },
  {
    name: "LocationSimulator",
    detail:
      "macOS 开源项目，可测试 iOS、iPadOS 等 Apple 设备的位置服务；旧版本项目不支持 iOS 17 及以上。",
    href: "https://github.com/Schlaubischlump/LocationSimulator",
  },
  {
    name: "TLocation",
    detail:
      "iOS 17.4+ 的设备端位置测试项目，需要配对文件、LocalDevVPN 和 SideStore / AltStore 等前置条件。",
    href: "https://github.com/truongkma/t-location",
  },
];

export const chaoxingSources = [
  {
    name: "ChaoxingSignFaker",
    detail:
      "Android 第三方学习通客户端项目，涉及多种签到类型。它不是本页的位置测试工具，使用前请阅读项目许可证和免责声明。",
    href: "https://github.com/aquamarine5/ChaoxingSignFaker",
  },
  {
    name: "chaoxing-sign-app",
    detail:
      "学习通第三方客户端项目，仓库说明包含普通、位置、拍照、二维码等签到类型，仅作项目资料参考。",
    href: "https://github.com/eric-gitta-moore/chaoxing-sign-app",
  },
  {
    name: "Chrome 模拟定位文章",
    detail:
      "掘金文章介绍 Chrome DevTools 的 Sensors 流程；页面步骤已按实际截图重新整理。",
    href: "https://juejin.cn/post/6844904158903074823",
  },
  {
    name: "loc567 文档中心",
    detail:
      "外部 iOS 定位文档，包含高风险的底层拦截与风控规避宣传，本页不复述其绕过方法。",
    href: "https://docs.loc567.com",
  },
];

export interface LinkSource {
  name: string;
  detail: string;
  href: string;
}
