const CACHE = "futarioe-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/", "/css/style.css", "/js/app.js", "/js/draw.js", "/icons/default.svg"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SET_ICON" && e.data.image) {
    self.partnerIcon = e.data.image;
  }
});
