import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "SkillBridge — Peer Learning & Doubt Resolution",
        short_name: "SkillBridge",
        description: "Post doubts, get matched with peers in real time, and build reputation by helping others.",
        theme_color: "#12141C",
        background_color: "#12141C",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Don't cache API/socket calls - the app should always hit the live backend,
        // only the static frontend shell gets cached for offline/installed use.
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
