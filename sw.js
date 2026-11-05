// 山行手札 service worker：主頁面先上網拿最新版（沒網路才用快取），其他檔案用快取
const CACHE = "shanxing-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  if (req.mode === "navigate" || (same && /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(req, {cache: "no-store"}).then(r => { caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: same});
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
