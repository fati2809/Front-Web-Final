/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare const self: ServiceWorkerGlobalScope;

// ==================== PRECACHE ====================
precacheAndRoute(self.__WB_MANIFEST);

// ==================== BACKGROUND SYNC ====================

// Cola para peticiones offline
const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

// ==================== RUTA ÚNICA PARA API ====================

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
  // 👇 IMPORTANTE: aplicar a múltiples métodos
  "POST"
);

// ==================== LOG DE SYNC ====================

self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("🔄 Sincronizando datos pendientes...");
  }
});