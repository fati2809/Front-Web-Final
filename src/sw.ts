/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const bgSyncPlugin = new BackgroundSyncPlugin("form-submissions-queue", {
  maxRetentionTime: 24 * 60, // 24 horas
});

const apiMatcher = ({ request, url }: { request: Request; url: URL }) =>
  url.origin === "https://maposting-backend.onrender.com" &&
  ["POST", "PUT", "PATCH"].includes(request.method);

const networkOnlyWithSync = new NetworkOnly({ plugins: [bgSyncPlugin] });

registerRoute(apiMatcher, networkOnlyWithSync, "POST");
registerRoute(apiMatcher, networkOnlyWithSync, "PUT");
registerRoute(apiMatcher, networkOnlyWithSync, "PATCH");

self.addEventListener("sync", (event) => {
  if (event.tag === "form-submissions-queue") {
    console.log("Sincronizando datos pendientes...");
  }
});