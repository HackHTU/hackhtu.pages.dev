import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/reveal";
import { TaglineReveal } from "@/components/tagline-reveal";

import { HeroSection } from "./hero";
import { IosSection, PlatformOverviewSection } from "./overview";
import { AndroidSection, ChaoxingSection, NotesSection } from "./sections";

const IntroSection = () => (
  <section className="px-6 py-24">
    <TaglineReveal />
  </section>
);

const CtaSection = () => (
  <section className="px-6 py-24">
    <Reveal className="mx-auto max-w-[680px] text-center">
      <h2 className="text-4xl font-semibold">先选平台，再开始位置测试</h2>
      <p className="text-muted-foreground mt-4 text-base leading-7">
        网页、Android 和 iOS
        的位置模拟方式不能互相替代。请把模拟定位留给开发测试，把学习通签到留给真实参与。
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="text-sm font-semibold underline underline-offset-4"
        >
          返回 Hack HTU 首页
        </Link>
      </div>
    </Reveal>
  </section>
);

export const LocationSimulationTutorialPage = () => (
  <main>
    <HeroSection />

    <IntroSection />

    <PlatformOverviewSection />

    <IosSection />

    <AndroidSection />

    <ChaoxingSection />

    <NotesSection />

    <CtaSection />
  </main>
);
