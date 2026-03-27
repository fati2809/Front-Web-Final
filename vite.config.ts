import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // permite probar PWA en desarrollo
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

      // ←←← CONFIGURACIÓN DE BACKGROUND SYNC ←←←
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,json}"],

        runtimeCaching: [
          {
            // Intercepta todos los POST a rutas que empiecen con /api/
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",        // Nunca usa cache para mutaciones
            method: "POST",
            options: {
              backgroundSync: {
                name: "form-submissions-queue",   // Nombre de la cola
                options: {
                  maxRetentionTime: 24 * 60,      // Mantener en cola máximo 24 horas
                },
              },
            },
          },
          {
            // También para PATCH y PUT (por si actualizas registros)
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "PATCH",
            options: {
              backgroundSync: {
                name: "form-submissions-queue",
                options: {
                  maxRetentionTime: 24 * 60,
                },
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
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    proxy: {
      // Si usas proxy en desarrollo, déjalo como está
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''),
      // },
    },
  },
});