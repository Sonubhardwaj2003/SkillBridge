import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // We register the service worker ourselves in main.jsx (so we can add
      // periodic update-checking for installed apps) - injectRegister:false
      // stops the plugin from ALSO auto-injecting its own basic register
      // script, which would double-register.
      injectRegister: false,
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
        // Remove old precached files left over from previous deploys instead
        // of letting them silently accumulate in storage.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});