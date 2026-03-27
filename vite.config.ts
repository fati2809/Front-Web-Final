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

      // Configuración mejorada de Background Sync
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json}"],

        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "POST",
            options: {
              backgroundSync: {
                name: "form-submissions-queue",
                options: {
                  maxRetentionTime: 24 * 60, // 24 horas
                },
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "PATCH",
            options: {
              backgroundSync: {
                name: "form-submissions-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "PUT",
            options: {
              backgroundSync: {
                name: "form-submissions-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    // tu proxy aquí si lo usas
  },
});