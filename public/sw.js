self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Required for PWA installability.
  // Can be expanded later for offline support.
  event.respondWith(fetch(event.request));
});
