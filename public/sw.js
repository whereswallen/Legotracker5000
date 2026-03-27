const CACHE_NAME = "legotracker-v2";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/signup",
  "/dashboard",
  "/collection",
  "/search",
  "/scan",
  "/minifigs",
  "/parts",
  "/profile",
  "/manifest.json",
];

// Cacheable API routes (for offline fallback)
const CACHEABLE_API = ["/api/sets", "/api/sets/stats", "/api/minifigs", "/api/parts", "/api/profile"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip auth routes
  if (url.pathname.startsWith("/api/auth/")) return;

  // API routes: network-first with cache fallback for offline
  if (url.pathname.startsWith("/api/")) {
    const isCacheable = CACHEABLE_API.some((p) => url.pathname.startsWith(p));
    if (isCacheable) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
    }
    return;
  }

  // HTML pages: network-first with cache fallback
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          if (
            response.ok &&
            (url.pathname.startsWith("/_next/static/") ||
              url.pathname.startsWith("/icons/"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      );
    })
  );
});
