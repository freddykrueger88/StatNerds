// StatNerds Service Worker v1
const CACHE = 'statnerds-v1';
const STATIC = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Push-Event: Nachricht vom Backend oder Polling-Logik
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '⚽ StatNerds', {
      body: data.body || 'Neue Spielinfo verfügbar',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'statnerds',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

// Notification-Klick → App öffnen
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if (c.url && 'focus' in c) return c.focus(); }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});

// Fetch: Network-first, Cache-Fallback für statische Dateien
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // API immer frisch
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
