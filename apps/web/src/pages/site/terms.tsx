import { Link } from "@tanstack/react-router";

import { ContentPage } from "@/components/content-page";

export const TermsPage = () => (
  <ContentPage
    kicker="法律"
    title="用户协议"
    description="请仔细阅读本协议。继续使用本站服务，即视为同意。"
  >
    <div className="text-muted-foreground max-w-[680px] space-y-8 text-sm">
      <section>
        <h2 className="text-foreground text-xl font-semibold">一、协议主体</h2>
        <p className="mt-3">
          本协议的主体是河南师范大学的学生，以及其他对本站感兴趣的自然人。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">二、服务内容</h2>
        <p className="mt-3">
          本站提供校园工具、交流平台，以及河师大学生交流群组。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">三、用户权益</h2>
        <p className="mt-3">
          在遵守本协议的前提下，可以使用本站服务、发表观点、分享经验，并参与本站活动。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">四、用户义务</h2>
        <p className="mt-3">
          遵守法律法规，不发布违法信息；尊重他人权益，不侵犯隐私和知识产权；不发布虚假信息或恶意刷屏；不恶意攻击或诋毁他人。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">五、隐私保护</h2>
        <p className="mt-3">
          本站尊重并保护用户隐私，详情见
          <Link
            to="/pages/privacy"
            className="text-foreground mx-1 font-semibold"
          >
            隐私政策
          </Link>
          。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">六、知识产权</h2>
        <p className="mt-3">
          本站提供的文字、图片、音频、视频等内容，适用
          <a
            href="https://creativecommons.org/licenses/by/4.0/legalcode.zh-hans"
            className="text-foreground mx-1 font-semibold"
            target="_blank"
            rel="noreferrer"
          >
            署名 4.0 协议国际版
          </a>
          。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">七、免责声明</h2>
        <p className="mt-3">
          本站尽力提供稳定服务，但对用户原因、不可抗力、使用主体或第三方造成的损失不承担责任。不对使用本站生成的内容，以及因推广本站造成的损失负责。
        </p>
      </section>
      <section>
        <h2 className="text-foreground text-xl font-semibold">八、协议变更</h2>
        <p className="mt-3">
          本站有权根据业务需要修改本协议。修改后在本站公布即生效，继续使用即视为同意。
        </p>
      </section>
    </div>
  </ContentPage>
);
