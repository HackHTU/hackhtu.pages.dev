import { MapPinIcon, WarningIcon } from "@phosphor-icons/react";

import { Reveal } from "@/components/reveal";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { AndroidPanel, ChaoxingPanel, IosPanel, WebPanel } from "./panels";

export const AndroidSection = () => (
  <section className="px-6 py-16">
    <Reveal className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-semibold">
          位置模拟方式
        </p>
        <h2 className="mt-3 text-3xl font-semibold">点击平台，展开对应教程</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          四个平台互相独立。你只需要展开自己正在使用的平台，不必把网页、Android、iOS
          和学习通的内容混在一起。
        </p>
      </div>

      <div className="space-y-5">
        <WebPanel />

        <AndroidPanel />

        <IosPanel />

        <ChaoxingPanel />
      </div>
    </Reveal>
  </section>
);

export const ChaoxingSection = () => (
  <section className="px-6 py-16">
    <Reveal className="mx-auto max-w-6xl">
      <div className="flex items-center gap-3">
        <WarningIcon size={24} weight="duotone" />
        <h2 className="text-3xl font-semibold">遇到问题时，按平台排查</h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          [
            "网页没有定位结果",
            "确认浏览器已允许定位，自己的测试页面重新请求了权限。检查 Sensors 是否选择了地点，结束后恢复 No override。",
          ],
          [
            "Android 找不到模拟位置入口",
            "不同品牌的设置路径不同。先确认开发者模式已开启，再在设置中搜索“模拟位置信息应用”或“选择模拟位置应用”。",
          ],
          [
            "iPhone 无法连接",
            "检查数据线、信任提示、开发者模式、电脑系统和工具支持的 iOS / iPadOS 版本，不要安装不明配置文件。",
          ],
          [
            "学习通签到失败",
            "可能是活动已结束、签到类型不匹配、权限被拒绝或活动有验证码与现场校验。不要尝试绕过验证，联系教师确认规则。",
          ],
          [
            "测试后位置没有恢复",
            "先停止位置工具，再取消 Android 的模拟应用或关闭 Apple 设备测试连接，最后用系统地图确认真实位置。",
          ],
          [
            "地图显示的位置有偏差",
            "不同地图可能使用不同坐标系。用地点名称和附近地标交叉确认，不要只比较经纬度数字。",
          ],
        ].map(([title, text]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-3">{text}</CardDescription>
          </Card>
        ))}
      </div>
    </Reveal>
  </section>
);

export const NotesSection = () => (
  <section className="px-6 py-16">
    <Reveal className="mx-auto max-w-6xl">
      <div className="border-border rounded-2xl border p-6 md:p-8">
        <div className="flex gap-4">
          <MapPinIcon className="mt-1 shrink-0" size={24} weight="duotone" />
          <div>
            <h2 className="text-2xl font-semibold">最后检查清单</h2>
            <ul className="text-muted-foreground mt-5 grid gap-3 text-sm leading-6 md:grid-cols-2">
              <li>✓ 已确认平台、工具版本和设备权限。</li>
              <li>✓ 学习通签到按真实位置和活动规则完成。</li>
              <li>✓ 位置测试只作用于自己的页面或应用。</li>
              <li>✓ 测试结束后已经停止工具并恢复真实位置。</li>
            </ul>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
