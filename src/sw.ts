/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly, NetworkFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60,
});

const networkOnlyWithSync = new NetworkOnly({ plugins: [bgSyncPlugin] });

registerRoute(
  ({ url }) => url.origin === "https://maposting-backend.onrender.com",
  networkOnlyWithSync,
  "POST"
);
registerRoute(
  ({ url }) => url.origin === "https://maposting-backend.onrender.com",
  networkOnlyWithSync,
  "PUT"
);
registerRoute(
  ({ url }) => url.origin === "https://maposting-backend.onrender.com",
  networkOnlyWithSync,
  "PATCH"
);

registerRoute(
  ({ url, request }) =>
    url.origin === "https://maposting-backend.onrender.com" &&
    request.method === "GET",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (response && response.status === 200) return response;
          return null;
        },
      },
    ],
  }),
  "GET"
);

self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("🔄 Sincronizando datos pendientes...");
  }
});