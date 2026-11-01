import {
  AndroidLogoIcon,
  DeviceMobileIcon,
  GlobeHemisphereWestIcon,
  QrCodeIcon,
} from "@phosphor-icons/react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { chaoxingSources, platformSources } from "./data";
import {
  PlatformPanel,
  ResourceCards,
  Steps,
  ToolLinks,
  TutorialImage,
} from "./ui";

export const WebPanel = () => (
  <PlatformPanel
    id="web"
    icon={<GlobeHemisphereWestIcon size={22} weight="duotone" />}
    eyebrow="方式一 · 网页定位"
    title="Chrome 或 Edge 的模拟定位"
    summary="适用于 Chromium 浏览器中的网页定位调试，只改变当前页面收到的坐标。"
    description="Chrome 和 Edge 都基于 Chromium，使用开发者工具中的 Sensors 可以测试自己网页的定位权限、成功、拒绝和超时状态。这个方法不会修改手机位置，也不会改变其他设备上的定位。"
  >
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <Card>
        <CardTitle>前置条件</CardTitle>
        <CardDescription className="mt-3">
          准备 Chrome 或
          Edge，以及一个你有权修改和测试的网页。测试学习通网页时，应使用真实位置完成课程签到。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>验证方式</CardTitle>
        <CardDescription className="mt-3">
          刷新自己的测试页面，确认页面收到预设坐标，并分别检查允许、拒绝和超时状态。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>恢复方式</CardTitle>
        <CardDescription className="mt-3">
          将 Location 改回 No override，关闭开发者工具并重新加载页面。
        </CardDescription>
      </Card>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-4">
      <TutorialImage
        src="web/01-search-place.png"
        alt="腾讯位置服务搜索地点截图"
        caption="第一步：在腾讯位置服务中搜索要测试的地点。"
      />
      <TutorialImage
        src="web/02-place-coordinates.png"
        alt="腾讯位置服务地点坐标详情截图"
        caption="第二步：打开地点详情，记录经纬度。"
      />
      <TutorialImage
        src="web/03-open-inspect.png"
        alt="浏览器右键检查菜单截图"
        caption="第三步：在自己的测试网页上右键，选择检查。"
      />
      <TutorialImage
        src="web/04-open-sensors.png"
        alt="浏览器开发者工具打开传感器截图"
        caption="第四步：打开更多工具中的传感器。"
      />
    </div>
    <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <h3 className="text-xl font-semibold">具体怎么做</h3>
        <div className="mt-6">
          <Steps
            steps={[
              {
                title: "打开自己的网页",
                text: "用 Chrome 或 Edge 打开需要测试定位权限的网页，按 F12 或右键选择检查。",
              },
              {
                title: "进入 Sensors",
                text: "点击开发者工具菜单，选择 More tools，再选择 Sensors，找到 Location 设置。",
              },
              {
                title: "选择测试位置",
                text: "选择预设地点，或选择 Other 后填写测试经度和纬度。坐标请使用可信地图服务查询。",
              },
              {
                title: "刷新并验证",
                text: "刷新自己的网页并允许定位，观察页面是否正确处理成功、拒绝和超时状态。",
              },
              {
                title: "恢复浏览器设置",
                text: "测试结束后将 Location 改回 No override，避免影响后续网页调试。",
              },
            ]}
          />
        </div>
      </div>
      <TutorialImage
        src="web/05-enter-custom-location.png"
        alt="浏览器自定义位置输入截图"
        caption="输入测试位置后刷新自己的网页验证，不要把调试结果当作学习通签到凭证。"
      />
    </div>
    <ToolLinks sources={[platformSources[0]]} />
  </PlatformPanel>
);

export const AndroidPanel = () => (
  <PlatformPanel
    id="android"
    icon={<AndroidLogoIcon size={22} weight="duotone" />}
    eyebrow="方式二 · Android 通用定位"
    title="Android 开发者选项与模拟位置应用"
    summary="适用于 Android 设备级定位测试，工具通过系统的模拟位置信息应用接口工作。"
    description="Android 可以在开发者选项中指定模拟位置信息应用。不同品牌的菜单名称会有差异，下面使用通用路径说明。学习通签到时请关闭模拟位置并使用真实定位；模拟位置部分只测试自己的应用。"
  >
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <Card>
        <CardTitle>前置条件</CardTitle>
        <CardDescription className="mt-3">
          准备 Android
          手机、自己的测试应用或定位测试页，以及可信来源的测试工具。不要安装来历不明的
          APK。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>验证方式</CardTitle>
        <CardDescription className="mt-3">
          在自己的应用中检查坐标、定位精度和更新时间，确认应用确实收到测试位置。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>恢复方式</CardTitle>
        <CardDescription className="mt-3">
          停止测试工具，在开发者选项中取消模拟位置应用，再用系统地图确认真实位置。
        </CardDescription>
      </Card>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <TutorialImage
        src="android/01-about-phone.png"
        alt="Android 关于手机页面截图"
        caption="第一步：进入关于手机，找到版本号。"
        portrait
      />
      <TutorialImage
        src="android/02-developer-options.png"
        alt="Android 开发者选项截图"
        caption="第二步：连续点击版本号，开启开发者选项。"
        portrait
      />
      <TutorialImage
        src="android/03-mock-location-app.png"
        alt="Android 选择模拟位置信息应用截图"
        caption="第三步：找到选择模拟位置信息应用。"
        portrait
      />
    </div>
    <div className="mt-8 grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <h3 className="text-xl font-semibold">具体怎么做</h3>
        <div className="mt-6">
          <Steps
            steps={[
              {
                title: "先关闭模拟位置完成签到",
                text: "打开系统定位和精确位置，给学习通定位权限，在教师要求的地点按活动规则完成签到。",
              },
              {
                title: "开启开发者选项",
                text: "进入设置中的关于手机，连续点击版本号，返回设置后进入开发者选项。不同品牌的入口文字可能不同。",
              },
              {
                title: "安装并选择测试工具",
                text: "安装自己信任的模拟位置测试工具，在选择模拟位置信息应用中选中它。影梭 GoGoGo 是相关项目示例。",
              },
              {
                title: "设置地点并验证应用",
                text: "在工具中搜索地点、地图选点或输入坐标，然后打开自己的应用检查收到的定位数据。",
              },
              {
                title: "停止并恢复真实位置",
                text: "停止工具，在开发者选项中取消模拟位置应用，再打开系统地图确认定位已恢复。",
              },
            ]}
          />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TutorialImage
          src="android/04-app-startup.png"
          alt="Android 位置测试应用启动截图"
          caption="启动测试应用，确认工具已经进入可操作状态。"
          portrait
        />
        <TutorialImage
          src="android/05-map-location.png"
          alt="Android 位置测试地图截图"
          caption="地图选点和输入坐标，仅用于自己的测试应用。"
          portrait
        />
      </div>
    </div>
    <ToolLinks sources={[platformSources[1]]} />
  </PlatformPanel>
);

export const IosPanel = () => (
  <PlatformPanel
    id="ios"
    icon={<DeviceMobileIcon size={22} weight="duotone" />}
    eyebrow="方式三 · iOS / iPadOS 设备定位"
    title="爱思助手或 GeoPort 的设备测试"
    summary="适用于 iPhone 与 iPad，通常需要连接 macOS 或 Windows 电脑，并完成设备信任与版本检查。"
    description="iOS 和 iPadOS 的设备级位置测试依赖系统版本、连接方式、信任状态和工具支持范围。爱思助手与 GeoPort 是两种不同的途径，不能把它们的步骤混在一起；开始前先查看对应项目的官方说明。"
  >
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <Card>
        <CardTitle>前置条件</CardTitle>
        <CardDescription className="mt-3">
          准备 iPhone 或 iPad、数据线和兼容电脑。先确认工具支持的 iOS / iPadOS
          版本，并完成设备信任。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>验证方式</CardTitle>
        <CardDescription className="mt-3">
          在自己的应用或定位测试页中观察坐标变化，不要把工具界面显示的位置当作学习通签到成功。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>恢复方式</CardTitle>
        <CardDescription className="mt-3">
          停止位置测试，断开设备并打开系统地图，确认真实位置已经恢复。
        </CardDescription>
      </Card>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <TutorialImage
        src="ios/01-device-tool.png"
        alt="iOS 设备测试工具截图"
        caption="连接前按工具要求完成设备识别与信任提示。"
        portrait
      />
      <TutorialImage
        src="ios/02-device-confirmation.png"
        alt="iOS 设备确认截图"
        caption="连接设备后确认工具识别到正确设备，再进入位置测试功能。"
        portrait
      />
      <TutorialImage
        src="ios/03-location-map.png"
        alt="iOS 位置测试地图截图"
        caption="设置测试点后，在自己的应用中观察位置变化。"
      />
    </div>
    <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <h3 className="text-xl font-semibold">具体怎么做</h3>
        <div className="mt-6">
          <Steps
            steps={[
              {
                title: "先用真实位置完成签到",
                text: "打开定位服务和精确位置，给学习通权限，按教师要求在真实地点完成课程活动。",
              },
              {
                title: "检查版本和连接方式",
                text: "选择爱思助手或 GeoPort 其中一种，查看它支持的系统版本、电脑系统和设备连接要求。",
              },
              {
                title: "连接并信任设备",
                text: "使用数据线连接设备，完成信任、开发者模式和工具提示的配对步骤，不安装来历不明的描述文件。",
              },
              {
                title: "设置测试点并验证",
                text: "在兼容工具中设置测试点，打开自己的应用观察定位权限、坐标更新和错误处理。",
              },
              {
                title: "停止测试并复原",
                text: "点击停止位置测试，断开设备，再打开系统地图确认真实位置已经恢复。",
              },
            ]}
          />
        </div>
      </div>
      <TutorialImage
        src="ios/04-location-result.png"
        alt="iOS 位置测试结果截图"
        caption="测试结束后停止位置模拟，断开设备并检查系统定位。"
      />
    </div>
    <ToolLinks
      sources={[
        platformSources[2],
        platformSources[3],
        platformSources[4],
        platformSources[5],
      ]}
    />
  </PlatformPanel>
);

export const ChaoxingPanel = () => (
  <PlatformPanel
    id="chaoxing"
    icon={<QrCodeIcon size={22} weight="duotone" />}
    eyebrow="方式四 · 特殊签到平台"
    title="学习通：特殊签到方式"
    summary="学习通不是普通的位置模拟平台，签到类型不同，所需条件也完全不同。"
    description="学习通签到应以教师发布的活动规则为准。位置模拟只能用于授权的网页或应用测试，不能替代真实到场、二维码协助、拍照要求或其他课堂验证。下面按签到类型说明边界，并列出相关项目作为资料参考。"
  >
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <Card>
        <CardTitle>普通、手势、签到码</CardTitle>
        <CardDescription className="mt-3">
          先确认活动时间和教师提供的信息，按课堂规则在活动页面完成，不要猜测或绕过签到内容。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle>位置、拍照签到</CardTitle>
        <CardDescription className="mt-3">
          位置签到需要按要求到场；拍照签到应使用现场真实照片，不使用他人照片或伪造现场凭证。
        </CardDescription>
      </Card>
      <Card>
        <CardTitle className="flex items-center">
          <QrCodeIcon size={22} />
          二维码签到
        </CardTitle>
        <CardDescription className="mt-3">
          二维码签到不能用下方三种模拟定位替代。二维码通常需要现场生成，由在场人员或教师允许的协助者扫码；不要伪造、转发动态二维码或绕过验证。
        </CardDescription>
      </Card>
    </div>
    <div className="border-border mt-8 rounded-2xl border p-6">
      <h3 className="text-xl font-semibold">学习通使用前检查</h3>
      <div className="mt-6">
        <Steps
          steps={[
            {
              title: "确认活动类型",
              text: "先判断是普通、位置、拍照、二维码、手势还是签到码签到，不同类型不能互相替代。",
            },
            {
              title: "确认现场要求",
              text: "位置、拍照和二维码签到可能依赖真实地点、现场照片或现场二维码，按教师和课程要求完成。",
            },
            {
              title: "遇到异常先沟通",
              text: "活动结束、二维码失效或权限异常时联系教师确认，不使用第三方工具伪造签到结果。",
            },
          ]}
        />
      </div>
    </div>
    <ResourceCards
      eyebrow="相关项目卡片"
      title="学习通与特殊签到参考"
      description="这些项目讨论学习通第三方客户端或签到流程，与网页、Android、iOS 位置测试路径不是同一个类别。它们不能改变课程规则。"
      sources={chaoxingSources}
    />
  </PlatformPanel>
);
