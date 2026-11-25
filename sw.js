/* Offline shell for the encrypted itinerary: network-first so a normal online visit
   gets the newest copy, cached copy when offline or the network is slow. */
const CACHE_NAME = 'xmas26-shell-v1';
const SHELL_FILES = ['./', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const NETWORK_TIMEOUT_MS = 4000;
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ns => Promise.all(ns.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = (await cache.match(req)) || (isPage ? await cache.match('./') : undefined);
    const net = fetch(req).then(res => { if (res.ok) cache.put(isPage ? './' : req, res.clone()).catch(() => {}); return res; });
    if (!cached) return net;
    try {
      return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), NETWORK_TIMEOUT_MS))]);
    } catch (e) { net.catch(() => {}); return cached; }
  })());
});
