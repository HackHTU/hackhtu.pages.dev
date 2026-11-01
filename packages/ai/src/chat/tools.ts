import type { Database } from "@hackhtu/db";
import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";

import type { AiConfig } from "../config";
import { forgetNote, rememberNote } from "../context/memory";
import { fetchPageMarkdown, safeUrl } from "../media/web";

export interface AiToolContext {
  chatId: number;
  config: AiConfig;
  db: Database;
  env: Env;
}

const wttrValue = z.object({ value: z.string() });

const wttrSchema = z.object({
  current_condition: z
    .array(
      z.object({
        temp_C: z.string().optional(),
        FeelsLikeC: z.string().optional(),
        humidity: z.string().optional(),
        windspeedKmph: z.string().optional(),
        weatherDesc: z.array(wttrValue).optional(),
        lang_zh: z.array(wttrValue).optional(),
      })
    )
    .optional(),
  nearest_area: z
    .array(z.object({ areaName: z.array(wttrValue).optional() }))
    .optional(),
});

type WttrResponse = z.infer<typeof wttrSchema>;

const weatherText = (data: WttrResponse): string => {
  const current = data.current_condition?.[0];

  if (current === undefined) {
    return "查不到天气数据喵…";
  }

  const area = data.nearest_area?.[0]?.areaName?.[0]?.value ?? "那里";

  const desc =
    current.lang_zh?.[0]?.value ?? current.weatherDesc?.[0]?.value ?? "未知";

  return [
    `${area}：${desc}`,
    `气温 ${current.temp_C ?? "?"}°C，体感 ${current.FeelsLikeC ?? "?"}°C`,
    `湿度 ${current.humidity ?? "?"}%，风速 ${current.windspeedKmph ?? "?"} km/h`,
  ].join("，");
};

const getWeather = async (city: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`,
      {
        headers: { "user-agent": "hackhtu-bot (+https://hackhtu.pages.dev)" },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!response.ok) {
      return "天气服务暂时连不上喵…";
    }

    const parsed = wttrSchema.safeParse(await response.json());

    return parsed.success ? weatherText(parsed.data) : "查不到天气数据喵…";
  } catch (error) {
    console.error("wttr.in failed", error);

    return "天气服务暂时连不上喵…";
  }
};

const readWebpage = async (ai: Ai, rawUrl: string): Promise<string> => {
  const url = safeUrl(rawUrl);

  if (url === null) {
    return "这个网址不能读（不是公网 http/https，或带有凭据）。";
  }

  const markdown = await fetchPageMarkdown(ai, url.href, 6000);

  return markdown ?? "网页读取失败或正文为空。";
};

/** 工具只保留天气、读网页和长期记忆；表情/换行/多消息由 bot 侧的指令后期处理。 */
export const createTools = (context: AiToolContext): ToolSet => ({
  get_weather: tool({
    description: "查询某个城市或地区的实时天气。",
    inputSchema: z.object({
      city: z.string().describe("城市名，中文或英文都行，例如 新乡、Beijing。"),
    }),
    execute: async ({ city }) => await getWeather(city),
  }),
  read_webpage: tool({
    description:
      "读取一个网页并返回正文的 Markdown 文本。用户发来链接、或你真的需要网页内容时调用。",
    inputSchema: z.object({
      url: z.string().describe("要读取的 http(s) 网址。"),
    }),
    execute: async ({ url }) => await readWebpage(context.env.AI, url),
  }),
  remember: tool({
    description:
      "往长期记忆里追加一条关于本群/群友的事实、偏好或约定。只在确实值得长期记住时调用。",
    inputSchema: z.object({
      note: z.string().describe("一句话事实，例如「小七喜欢被叫主人」。"),
    }),
    execute: async ({ note }) => {
      const content = await rememberNote(
        context.db,
        context.chatId,
        note,
        context.config.aiMemoryLimit
      );

      return `已记住。当前长期记忆：\n${content}`;
    },
  }),
  forget: tool({
    description: "从长期记忆里删除包含指定关键词的条目。",
    inputSchema: z.object({
      note: z.string().describe("要删除的记忆关键词。"),
    }),
    execute: async ({ note }) => {
      const content = await forgetNote(
        context.db,
        context.chatId,
        note,
        context.config.aiMemoryLimit
      );

      return `已更新。当前长期记忆：\n${content}`;
    },
  }),
});
