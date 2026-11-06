import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import drizzle from "ultracite/oxlint/drizzle";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import tanstackJsPlugins from "ultracite/oxlint/tanstack/js-plugins";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  env: core.env,
  extends: [
    core,
    react,
    drizzle,
    tanstack,
    vitest,
    tanstackJsPlugins,
    shadcn,
    antiSlop,
    jsPlugins,
  ],
  ignorePatterns: [
    ...core.ignorePatterns,
    "apps/web/src/components/react-bits/**",
  ],
  jsPlugins: [...jsPlugins.jsPlugins, ...shadcn.jsPlugins],
  options: { typeAware: true },
  overrides: [
    {
      files: ["apps/bot/tests/**/*.test.ts"],
      rules: {
        // Bot 测试使用 bun:test，不自动注入未安装的 Vitest。
        "vitest/prefer-importing-vitest-globals": "off",
        // 内存 SQLite 和 Telegram API 替身仅暴露被测路径需要的接口。
        "typescript/no-unsafe-type-assertion": "off",
        // 模拟 API 保持 Promise 接口，避免 require-await 与自动 async 修复相互冲突。
        "require-await": "off",
      },
    },
  ],
  rules: {
    "max-lines": ["error", { max: 500 }],
  },
  settings: jsPluginSettings,
});
