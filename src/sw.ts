/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// Declaración global para que TypeScript reconozca __WB_MANIFEST
declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Precarga los archivos estáticos de tu aplicación
precacheAndRoute(self.__WB_MANIFEST);

// ==================== BACKGROUND SYNC PARA FORMULARIOS ====================

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

// Intercepta el POST para crear usuarios
// Ajusta según tu ruta exacta (en tus capturas aparece "/register")
registerRoute(
  ({ url }) => url.pathname === "/register" || url.pathname.startsWith("/api/"),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

// Opcional: también para actualizaciones (PATCH/PUT)
registerRoute(
  ({ url }) => url.pathname === "/register" || url.pathname.startsWith("/api/"),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "PATCH"
);

registerRoute(
  ({ url }) => url.pathname === "/register" || url.pathname.startsWith("/api/"),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "PUT"
);

// Log cuando se activa la sincronización en background
self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("🔄 Sincronizando formularios/usuarios pendientes...");
  }
});