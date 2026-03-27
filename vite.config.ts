import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },

      // Estrategia recomendada para Background Sync
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",

      manifest: {
        name: "Mapposting",
        short_name: "Mapposting",
        description: "App de gestión de eventos",
        theme_color: "#111827",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    // proxy: { ... } si lo necesitas
  },
});