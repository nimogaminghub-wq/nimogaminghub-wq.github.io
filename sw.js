// Service Worker for Nimo's Gaming PWA
// Handles caching, offline functionality, and app installation

const CACHE_NAME = 'nimos-gaming-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/CSS/Style.css',
  '/CSS/GameCards.css',
  '/JS/Data.js',
  '/JS/Main.js',
  '/JS/download.js',
  '/icon/favicon.ico',
  '/Pages/android.html',
  '/Pages/ppsspp.html',
  '/Pages/ps2.html',
  '/Pages/search.html',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip analytics and external requests
  if (event.request.url.includes('google-analytics') ||
      event.request.url.includes('external')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return a custom offline page if needed
            return new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for future use (download tracking)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-downloads') {
    event.waitUntil(syncDownloads());
  }
});

// Sync downloads helper
async function syncDownloads() {
  try {
    const downloads = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
    // Could send to analytics server when online
    console.log('Downloads synced:', downloads.length);
  } catch (error) {
    console.log('Sync failed:', error);
  }
}
