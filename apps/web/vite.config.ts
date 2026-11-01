import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // 与 Wrangler / bot 脚本共用仓库根目录的 .env
  envDir: path.resolve(import.meta.dirname, "../.."),
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
          "河师大学生工具站：课程评价查询、学校新闻、请假条生成、跨平台位置模拟教程、校园网一键登录脚本和匿名评论区。",
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
});
