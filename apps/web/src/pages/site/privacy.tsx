import { ContentPage } from "@/components/content-page";

const sections = [
  {
    title: "一、个人信息收集",
    body: [
      "本站在你使用服务时，会收集用户名、IP 地址等信息。",
      "本站还可能收集使用过程中的行为数据，如访问日志和操作记录。",
    ],
  },
  {
    title: "二、个人信息使用",
    body: [
      "用于判断是否为机器人或自动程序、改善体验、做行为分析、回应咨询，以及提供需要个人信息的服务。",
    ],
  },
  {
    title: "三、个人信息保护",
    body: [
      "本站采取合理的技术手段和组织措施，保护个人信息不被未经授权的访问、泄露、篡改、损坏或丢失。",
      "本站会定期审查和评估保护措施。",
    ],
  },
  {
    title: "四、个人信息共享与披露",
    body: [
      "本站不会向无关第三方出售、出租、分享或披露个人信息，除非获得明确同意，或为维护本站合法权益。",
    ],
  },
  {
    title: "五、用户权利",
    body: [
      "你可以查询、更正、删除个人信息，也可以通过本站提供的途径注销账户。",
    ],
  },
  {
    title: "六、隐私政策的变更",
    body: ["本站可能会更新隐私政策。更新后会在本站公布，并标注更新日期。"],
  },
  {
    title: "七、联系我们",
    body: ["如果对隐私政策有疑问或建议，请通过官网底部的方式联系我们。"],
  },
];

export const PrivacyPage = () => (
  <ContentPage
    kicker="法律"
    title="隐私政策"
    description="本政策适用于 Hack HTU 河南师范大学工具站及其提供的所有服务。"
  >
    <div className="max-w-[680px] space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground mt-3 text-sm">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  </ContentPage>
);
