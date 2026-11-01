import { Outlet } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const App = () => (
  <div className="bg-background text-foreground min-h-dvh">
    <a href="#main" className="sr-only focus:not-sr-only">
      跳到正文
    </a>
    <SiteHeader />
    <div id="main">
      <Outlet />
    </div>
    <SiteFooter />
  </div>
);
