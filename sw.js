/* Кэширует оболочку приложения, чтобы оно открывалось без интернета.
   Данные пользователя лежат в localStorage и этим файлом не затрагиваются.
   При выпуске новой версии меняйте номер в CACHE. */
const CACHE = 'fin-ledger-shell-v6';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cache: 'reload' — берём свежие файлы с сервера, а не из HTTP-кэша браузера
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(url.href, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit || caches.match('index.html'));
      return hit || net;                                       // сначала кэш, обновление в фоне
    })
  );
});
