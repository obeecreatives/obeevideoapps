// OmniCut Studio AI PWA Service Worker
const CACHE_NAME = 'omnicut-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser fetch network requests directly for live API calls and video assets
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
