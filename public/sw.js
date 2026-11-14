/* Service worker de l'oliveraie d'Afourer.
 * - Fichiers statiques (_next/static, icônes) : cache puis réseau.
 * - Pages : réseau d'abord ; en cas de coupure, dernière version consultée (avec sa mention « dernière mise à jour »).
 * - Jamais de cache pour /api, /code ni pour les réponses redirigées (session expirée).
 */
const VERSION = "v1";
const CACHE_STATIQUE = `statique-${VERSION}`;
const CACHE_PAGES = `pages-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const noms = await caches.keys();
      await Promise.all(
        noms
          .filter((n) => n !== CACHE_STATIQUE && n !== CACHE_PAGES)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

const PAGE_HORS_LIGNE = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors connexion</title>
<style>body{font-family:system-ui,sans-serif;background:#F6F1E7;color:#2A2722;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}
h1{color:#3B4520;font-size:1.6rem}p{color:#6F624F;font-size:1.05rem}</style></head>
<body><main><h1>Vous êtes hors connexion</h1><p>Cette page n'a pas encore été consultée. Reconnectez-vous à internet puis réessayez.</p></main></body></html>`;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/code" || url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE_STATIQUE).then(async (cache) => {
        const enCache = await cache.match(req);
        if (enCache) return enCache;
        const rep = await fetch(req);
        if (rep.ok) cache.put(req, rep.clone());
        return rep;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_PAGES);
        try {
          const rep = await fetch(req);
          if (rep.ok && !rep.redirected && rep.type === "basic") {
            cache.put(req, rep.clone());
          }
          return rep;
        } catch {
          const enCache = await cache.match(req, { ignoreSearch: false });
          if (enCache) return enCache;
          const accueil = await cache.match("/");
          if (accueil) return accueil;
          return new Response(PAGE_HORS_LIGNE, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      })(),
    );
  }
});
