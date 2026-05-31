// Service Worker — caches the app shell for offline use
const CACHE = 'retrieval-builder-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/retrieval_icon.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache what we can, skip failures (fonts/CDN may be blocked offline)
      return Promise.allSettled(SHELL.map(function(url) {
        return cache.add(url).catch(function(){});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network first for API calls, cache first for app shell
  if (e.request.url.includes('workers.dev') || e.request.url.includes('anthropic.com')) {
    return; // Always network for API
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(e.request, resp.clone());
          return resp;
        });
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});
