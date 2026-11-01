import { ArrowUpRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { imageBase } from "./data";
import type { LinkSource } from "./data";

export const TutorialImage = ({
  src,
  alt,
  caption,
  portrait = false,
}: {
  src: string;
  alt: string;
  caption: string;
  portrait?: boolean;
}) => (
  <figure className="border-border bg-card overflow-hidden rounded-2xl border">
    <div className="bg-muted dark:bg-primary p-3">
      <img
        src={`${imageBase}${src}`}
        alt={alt}
        loading="lazy"
        className={`w-full rounded-xl object-contain ${portrait ? "max-h-[32rem]" : "max-h-[28rem]"}`}
      />
    </div>
    <figcaption className="text-muted-foreground px-4 py-3 text-sm leading-6">
      {caption}
    </figcaption>
  </figure>
);

const StepNumber = ({ children }: { children: number }) => (
  <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
    {children}
  </span>
);

export const Steps = ({
  steps,
}: {
  steps: { title: string; text: string }[];
}) => (
  <ol className="space-y-5">
    {steps.map((step, index) => (
      <li key={step.title} className="flex gap-4">
        <StepNumber>{index + 1}</StepNumber>
        <div>
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {step.text}
          </p>
        </div>
      </li>
    ))}
  </ol>
);

export const SourceLink = ({ source }: { source: LinkSource }) => (
  <a
    href={source.href}
    target="_blank"
    rel="noreferrer"
    className="group border-border focus-visible:outline-ring flex items-start justify-between gap-4 rounded-2xl border p-5 transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2"
  >
    <span>
      <span className="mt-2 block font-semibold">{source.name}</span>
      <span className="text-muted-foreground mt-1 block text-sm leading-6">
        {source.detail}
      </span>
    </span>
    <ArrowUpRightIcon
      className="text-muted-foreground shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
      size={20}
    />
  </a>
);

export const ToolLinks = ({ sources }: { sources: LinkSource[] }) => (
  <div className="mt-8">
    <p className="text-muted-foreground text-sm font-semibold">
      相关项目与工具
    </p>
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {sources.map((source) => (
        <SourceLink key={source.name} source={source} />
      ))}
    </div>
  </div>
);

export const ResourceCards = ({
  eyebrow,
  title,
  description,
  sources,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sources: LinkSource[];
}) => (
  <div className="border-border mt-8 rounded-2xl border p-6 md:p-8">
    <p className="text-muted-foreground text-sm font-semibold">{eyebrow}</p>
    <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
    <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
      {description}
    </p>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {sources.map((source) => (
        <SourceLink key={source.name} source={source} />
      ))}
    </div>
  </div>
);

export const PlatformPanel = ({
  id,
  icon,
  eyebrow,
  title,
  description,
  summary,
  children,
}: {
  id: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  summary: string;
  children: ReactNode;
}) => (
  <details
    id={id}
    open={id === "web"}
    className="group border-border bg-card scroll-mt-8 rounded-2xl border"
  >
    <summary className="focus-visible:outline-ring flex cursor-pointer list-none items-start justify-between gap-6 p-6 focus-visible:outline-2 focus-visible:outline-offset-2 md:p-8">
      <span className="flex gap-4">
        <span className="bg-secondary mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <span>
          <span className="text-muted-foreground text-sm font-semibold">
            {eyebrow}
          </span>
          <span className="text-foreground mt-2 block text-2xl font-semibold md:text-3xl">
            {title}
          </span>
          <span className="text-muted-foreground mt-3 block max-w-3xl text-sm leading-6">
            {summary}
          </span>
        </span>
      </span>
      <CaretDownIcon
        className="text-muted-foreground mt-2 shrink-0 transition-transform duration-500 ease-out group-open:rotate-180"
        size={24}
      />
    </summary>
    <div className="border-border border-t px-6 pt-8 pb-8 md:px-8">
      <p className="text-muted-foreground max-w-3xl text-base leading-7">
        {description}
      </p>
      {children}
    </div>
  </details>
);
