import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const NotFoundPage = () => (
  <main className="mx-auto flex min-h-[70dvh] max-w-[680px] flex-col items-center justify-center px-6 py-24 text-center">
    <p className="text-muted-foreground text-sm font-semibold">404</p>
    <h1 className="mt-4 text-5xl font-semibold">页面未找到</h1>
    <p className="text-muted-foreground mt-4 text-base">
      这个地址没有对应页面。可以回到首页，或打开课程评价查询。
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button asChild>
        <Link to="/">返回首页</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/tools/class-recommend">查看课程评价</Link>
      </Button>
    </div>
  </main>
);
