/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare const self: ServiceWorkerGlobalScope;

// Precarga archivos estáticos
precacheAndRoute(self.__WB_MANIFEST);

// ==================== BACKGROUND SYNC ====================

// ==================== BACKGROUND SYNC ====================

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

// Interceptar TODAS las requests al backend (POST, PUT, PATCH)
registerRoute(
  ({ request, url }) => {
    return (
      url.origin === "https://maposting-backend.onrender.com" &&
      ["POST", "PUT", "PATCH"].includes(request.method)
    );
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST" // 👈 esto sigue siendo necesario aunque filtres arriba
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