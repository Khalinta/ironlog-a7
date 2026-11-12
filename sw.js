/* IronLog service worker: uygulamayı internetsiz çalıştırır.
   Uygulama dosyalarını HER değiştirdiğinde CACHE sürümünü artır; yoksa telefonlar güncellemeyi almaz. */
const CACHE = 'ironlog-v11';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './program.js',
  './app.js',
  './manifest.webmanifest',
  './icons/logo-180.png',
  './icons/logo-192.png',
  './icons/logo-512.png',
  './icons/logo-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // Bütün dosyalar tek seferde, taze olarak indirilir; biri bile inmezse bu sürüm devreye girmez.
  // "?v=" eki, sunucu önündeki önbelleğin eski dosya vermesini engeller.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (u) => {
      const res = await fetch(`${u}?v=${CACHE}`, { cache: 'reload' });
      if (!res.ok) throw new Error('indirilemedi: ' + u);
      await cache.put(u, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Önce önbellek. Dosyalar arka planda tek tek yenilenmez: yoksa yarım kalan bir güncelleme
// eski sayfa ile yeni kodu karıştırabilir. Güncelleme yalnızca CACHE sürümü artınca, topluca gelir.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(req); } catch (_) { return new Response('Çevrimdışı', { status: 503, statusText: 'Offline' }); }
  })());
});
