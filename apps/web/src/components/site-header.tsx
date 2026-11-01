import { Link, useRouterState } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { ComponentProps, ReactNode } from "react";

import { SiteLogo } from "@/components/site-logo";
import { useDarkMode } from "@/hooks/use-dark-mode";

const PillNav = lazy(
  async () => await import("@/components/react-bits/PillNav")
);

const navItems = [{ label: "加入我们", href: "/pages/joinus" }];

const RouterLink = ({
  href,
  children,
  ...props
}: {
  href?: string;
  children?: ReactNode;
} & Omit<ComponentProps<typeof Link>, "to">) => (
  <Link to={href ?? "/"} {...props}>
    {children}
  </Link>
);

export const SiteHeader = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isDark = useDarkMode();

  return (
    <header className="sticky top-3 z-40 px-6">
      <div className="mx-auto max-w-6xl">
        <Suspense
          fallback={
            <div className="border-border/80 bg-background/85 h-11 w-full rounded-full border" />
          }
        >
          <PillNav
            logo={<SiteLogo className="h-full w-full" />}
            logoAlt="Hack HTU 首页"
            logoHref="/"
            items={navItems}
            activeHref={pathname}
            linkComponent={RouterLink}
            theme={isDark ? "dark" : "light"}
            layout="split"
            size="sm"
            surface="glass"
            itemStyle="plain"
            collapse="never"
            highlightColor="#3462ad"
            highlightTextColor="#ffffff"
            className="w-full justify-between"
            ariaLabel="站点导航"
          />
        </Suspense>
      </div>
    </header>
  );
};
