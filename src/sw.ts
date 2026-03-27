/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare const self: ServiceWorkerGlobalScope;

// Precarga archivos estáticos
precacheAndRoute(self.__WB_MANIFEST);

// ==================== BACKGROUND SYNC ====================

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

// Configuración para interceptar requests a tu backend (dominio externo)
registerRoute(
  ({ url }) => 
    url.pathname === "/eventos" || 
    url.pathname.startsWith("/api/") ||
    url.host === "maposting-backend.onrender.com",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

// También para PATCH y PUT (por si actualizas eventos o usuarios)
registerRoute(
  ({ url }) => 
    url.pathname === "/eventos" || 
    url.host === "maposting-backend.onrender.com",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "PATCH"
);

registerRoute(
  ({ url }) => 
    url.pathname === "/eventos" || 
    url.host === "maposting-backend.onrender.com",
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "PUT"
);

// Log de sincronización
self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("🔄 Sincronizando formularios pendientes...");
  }
});