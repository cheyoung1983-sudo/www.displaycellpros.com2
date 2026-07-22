const CACHE_NAME = "dcp-diagnostic-lab-cache-v3";
const TEMPLATE_URL = "/api/ticket-templates";

const ASSETS_TO_PRECACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon.svg",
  "/api/ticket-templates"
];

// Install Event - Pre-cache core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core layout files...");
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing legacy cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Handle caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Strategy 1: Stale-While-Revalidate for the repair ticket templates endpoint
  if (url.pathname === TEMPLATE_URL) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Trigger a network fetch in the background to revalidate the cache
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => {
              console.warn("[Service Worker] Background revalidation fetch failed for templates:", err);
            });

          // If cache hit exists, serve it immediately (super responsive/stale)
          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise wait for network fetch (and if that fails, serve default offline fallback)
          return fetchPromise.then((networkResponse) => {
            if (networkResponse) {
              return networkResponse;
            }
            
            // Return default emergency offline template if network fails and cache is empty
            return new Response(
              JSON.stringify([
                {
                  id: "tpl-fallback-screen",
                  name: "Offline Screen Replacement Template (Emergency)",
                  brand: "General",
                  issueType: "screen",
                  description: "Emergency local repair layout loaded from offline device registers.",
                  estimatedTime: "45 mins",
                  difficulty: "Intermediate",
                  defaultPrice: 129.00
                }
              ]),
              {
                headers: { "Content-Type": "application/json" }
              }
            );
          });
        });
      })
    );
    return;
  }

  // Strategy 2: Cache-First for core static assets (HTML, CSS, JS, icons)
  const isSelfOrigin = url.origin === self.location.origin;
  const isAsset = 
    request.destination === "document" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.includes("/assets/") ||
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico");

  if (isSelfOrigin && isAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Cache hit: Serve immediately from local cache
          return cachedResponse;
        }

        // Cache miss: Retrieve from network, save to cache, and serve
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // If offline and cache miss occurs for navigations/documents, serve index.html
            if (request.mode === "navigate" || request.destination === "document") {
              const homePage = await caches.match("/index.html");
              if (homePage) return homePage;
            }
            return new Response("Diagnostic Asset is offline", { status: 404 });
          });
      })
    );
    return;
  }

  // Strategy 3: Network-First default for all other requests (such as dynamic APIs)
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response("Diagnostic API offline", { status: 503 });
      });
    })
  );
});
