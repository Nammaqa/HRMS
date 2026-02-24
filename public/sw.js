const CACHE_NAME = 'attendance-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon.png',
  '/logo.png',
  '/offline.html'
];

// Install event: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets are not available
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: cache-first for static assets, network-first for others
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // DO NOT CACHE: API routes, auth routes, and non-GET requests
  if (url.pathname.startsWith('/api/') || request.method !== 'GET' || url.pathname.startsWith('/api/auth/')) {
    // Network-only for APIs and auth
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests: try network first, fallback to cached offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If navigation succeeded, optionally cache the response for offline home
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Static asset requests (css/js/images/fonts): cache-first
  if (/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200) return response;
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            return response;
          })
          .catch(() => null);
      })
    );
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Future: Push notification listener (prepare structure)
self.addEventListener('push', event => {
  // FCM push notifications will be handled here
  // Structure prepared for future implementation
  if (event.data) {
    const notificationData = event.data.json();
    const options = {
      body: notificationData.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notificationData.tag || 'attendance-notification',
      requireInteraction: false
    };
    event.waitUntil(
      self.registration.showNotification(notificationData.title || 'Attendance', options)
    );
  }
});

// Future: Background sync (prepare structure)
self.addEventListener('sync', event => {
  // Background sync for offline attendance records
  // Structure prepared for future implementation
  if (event.tag === 'sync-attendance') {
    event.waitUntil(
      // Sync logic will be implemented here
      Promise.resolve()
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
