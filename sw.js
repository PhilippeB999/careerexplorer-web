/* Service worker — Career Explorer.
   RÉSEAU D'ABORD : en ligne on sert toujours la version fraîche et on met le
   cache à jour ; hors ligne seulement, on se rabat sur le cache. C'est ce qui
   évite les versions périmées. Bumpe CACHE (v1 → v2…) à chaque déploiement.
   On n'intercepte QUE les fichiers du site : Supabase, CDN et l'analytique
   passent sans interception (url.origin !== location.origin). */

const CACHE = "careerexplorer-v4";
const ASSETS = [
  "index.html",
  "app.js",
  "data.js",
  "style.css",
  "manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Supabase / CDN passent tels quels
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() =>
      caches.match(e.request).then((hit) => hit || caches.match("index.html"))
    )
  );
});
