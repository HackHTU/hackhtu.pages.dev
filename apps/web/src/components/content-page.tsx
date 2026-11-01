import type { ReactNode } from "react";

export const ContentPage = ({
  kicker,
  title,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <main className="mx-auto max-w-6xl px-6 py-16">
    <div className="max-w-[680px]">
      {kicker === undefined ? null : (
        <p className="text-muted-foreground text-sm font-semibold">{kicker}</p>
      )}
      <h1 className="mt-3 text-5xl font-semibold">{title}</h1>
      {description === undefined ? null : (
        <p className="text-muted-foreground mt-4 text-base">{description}</p>
      )}
    </div>
    <div className="mt-12">{children}</div>
  </main>
);
