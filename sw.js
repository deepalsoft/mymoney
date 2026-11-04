// Caches the app files so it opens with no internet. Bump VERSION when you upload a new index.html.
const VERSION = 'mymoney-v14';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;   // data calls go straight to Google
  // network first (so new versions show up at once), cached copy when there is no internet
  e.respondWith(caches.open(VERSION).then(async c => {
    try {
      const res = await Promise.race([fetch(r, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(rej, 4000))]);
      if (res && res.ok) c.put(r, res.clone());
      return res;
    } catch (x) {
      return (await c.match(r, { ignoreSearch: true })) || (await c.match('./index.html'));
    }
  }));
});
