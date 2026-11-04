import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// 与 Wrangler / bot 脚本共用仓库根目录的 .env
const envDir = path.resolve(import.meta.dirname, "../..");

export default defineConfig(({ command, mode }) => {
  // site key 会被打进浏览器代码，缺失时 Turnstile 直接不渲染，
  // 页面只会显示「验证码未配置」。这里在构建期就报错，别等上线才发现。
  const env = loadEnv(mode, envDir, "VITE_");

  if (command === "build" && !env.VITE_TURNSTILE_SITE_KEY) {
    throw new Error(
      "缺少 VITE_TURNSTILE_SITE_KEY。本地检查 .env，Cloudflare Pages 检查 production / preview 的构建变量。"
    );
  }

  return {
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: false,
        },
        includeAssets: [
          "favicons/favicon-32x32.png",
          "favicons/apple-touch-icon-180x180.png",
        ],
        manifest: {
          id: "/",
          name: "Hack HTU",
          short_name: "Hack HTU",
          description:
            "河师大学生工具站：课程评价查询、学校新闻、请假条生成、跨平台位置模拟教程、校园网一键登录脚本、校园生活地图、校园树洞墙和意见反馈。",
          lang: "zh-CN",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#111111",
          icons: [
            {
              src: "/favicons/android-icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/favicons/apple-touch-icon-180x180.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//u, /^\/bot\//u],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8788",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
  };
});
