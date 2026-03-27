/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// Declaración correcta de tipos para evitar conflictos
declare const self: ServiceWorkerGlobalScope;

// Precarga los archivos estáticos (VitePWA inyecta el manifest automáticamente)
precacheAndRoute(self.__WB_MANIFEST);

// ==================== BACKGROUND SYNC PARA FORMULARIOS ====================

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

// Intercepta POST a /register (según lo que ves en consola)
registerRoute(
  ({ url }) => url.pathname === "/register" || url.pathname.startsWith("/api/"),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

// Opcional: también para PATCH y PUT
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

// Evento cuando se activa la sincronización
self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("🔄 Sincronizando formularios/usuarios pendientes...");
  }
});