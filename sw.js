// sw.js - service worker SIMA.
// Hanya menyimpan "cangkang" halaman login (file milik GitHub ini).
// Aplikasi sebenarnya (Apps Script) tidak disimpan dan tetap butuh internet.
// Strategi: jaringan dulu, cache hanya cadangan. Jadi perubahan file
// (misalnya config.js) langsung terlihat, tidak tertahan cache lama.

const CACHE = 'sima-shell-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './pwa.css',
  './config.js',
  './app.js',
  './pwa.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  const url = new URL(req.url);
  // Hanya GET milik situs ini. Permintaan ke Apps Script dibiarkan lewat.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          const salinan = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, salinan); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined);
        });
      })
  );
});
