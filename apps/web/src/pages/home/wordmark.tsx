import { lazy, Suspense } from "react";

const TechText = lazy(
  async () => await import("@/components/react-bits/TechText")
);

export const HomeWordmark = () => (
  <section className="px-6 py-12 md:py-24">
    <div className="text-foreground mx-auto h-20 max-w-6xl sm:h-32 md:h-48">
      <Suspense fallback={null}>
        <TechText
          text="HackHTU"
          color="currentColor"
          accentColor="currentColor"
          fontSize={140}
          fontWeight={600}
          letterSpacing={-0.04}
          className="h-full w-full"
        />
      </Suspense>
    </div>
  </section>
);
