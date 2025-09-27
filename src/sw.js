// FindBook Service Worker - Advanced Caching Strategy
const CACHE_NAME = 'findbook-v1.2.0';
const STATIC_CACHE_NAME = 'findbook-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'findbook-dynamic-v1.2.0';
const API_CACHE_NAME = 'findbook-api-v1.2.0';
const IMAGE_CACHE_NAME = 'findbook-images-v1.2.0';

// Cache strategies
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const API_CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/favicon.ico',
    '/assets/images/book-placeholder.png',
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
    /^https:\/\/www\.googleapis\.com\/books\/v1\/volumes/,
];

// Image URLs to cache
const CACHEABLE_IMAGE_PATTERNS = [
    /^https:\/\/books\.google\.com\/books\/content/,
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
];

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install event');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Failed to cache static assets:', error);
            })
    );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate event');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('findbook-') &&
                            !Object.values({
                                CACHE_NAME,
                                STATIC_CACHE_NAME,
                                DYNAMIC_CACHE_NAME,
                                API_CACHE_NAME,
                                IMAGE_CACHE_NAME
                            }).includes(cacheName)) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Cache cleanup completed');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different resource types with appropriate strategies
    if (isStaticAsset(request.url)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request.url)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isImageRequest(request.url)) {
        event.respondWith(handleImageRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.endsWith(asset)) ||
        url.includes('/assets/') ||
        url.endsWith('.css') ||
        url.endsWith('.js') ||
        url.endsWith('.ico');
}

/**
 * Check if request is for an API endpoint
 */
function isAPIRequest(url) {
    return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if request is for an image
 */
function isImageRequest(url) {
    return CACHEABLE_IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Handle static assets with Cache First strategy
 */
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
            console.log('[ServiceWorker] Serving static asset from cache:', request.url);
            return cached;
        }

        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[ServiceWorker] Static asset request failed:', error);

        // Return cached version if available
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }

        // Return offline fallback for HTML requests
        if (request.url.endsWith('.html') || request.headers.get('accept').includes('text/html')) {
            return new Response(getOfflineFallbackHTML(), {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        throw error;
    }
}

/**
 * Handle API requests with Stale While Revalidate strategy
 */
async function handleAPIRequest(request) {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        const cached = await cache.match(request);

        // Return cached response immediately if available and not expired
        if (cached) {
            const cacheTime = new Date(cached.headers.get('sw-cache-time') || 0);
            const isExpired = Date.now() - cacheTime.getTime() > API_CACHE_MAX_AGE;

            if (!isExpired) {
                console.log('[ServiceWorker] Serving API response from cache:', request.url);

                // Fetch in background to update cache
                fetch(request)
                    .then(response => {
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            responseClone.headers.set('sw-cache-time', new Date().toISOString());
                            cache.put(request, responseClone);
                        }
                    })
                    .catch(() => { }); // Ignore background fetch errors

                return cached;
            }
        }

        // Fetch from network
        const response = await fetch(request);

        if (response.status === 200) {
            const responseClone = response.clone();
            responseClone.headers.set('sw-cache-time', new Date().toISOString());
            cache.put(request, responseClone);
        }

        return response;
    } catch (error) {
        console.error('[ServiceWorker] API request failed:', error);

        // Return cached version if available
        const cache = await caches.open(API_CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            console.log('[ServiceWorker] Serving stale API response from cache:', request.url);
            return cached;
        }

        // Return offline message for API requests
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This request failed and no cached data is available. Please try again when online.'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Handle image requests with Cache First strategy
 */
async function handleImageRequest(request) {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
            console.log('[ServiceWorker] Serving image from cache:', request.url);
            return cached;
        }

        const response = await fetch(request);
        if (response.status === 200) {
            // Only cache successful responses
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[ServiceWorker] Image request failed:', error);

        // Return cached version if available
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }

        // Return placeholder image
        return fetch('/assets/images/book-placeholder.png');
    }
}

/**
 * Handle dynamic requests with Network First strategy
 */
async function handleDynamicRequest(request) {
    try {
        const response = await fetch(request);

        if (response.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[ServiceWorker] Dynamic request failed:', error);

        // Return cached version if available
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            console.log('[ServiceWorker] Serving dynamic content from cache:', request.url);
            return cached;
        }

        throw error;
    }
}

/**
 * Generate offline fallback HTML
 */
function getOfflineFallbackHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>FindBook - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          margin: 0;
          padding: 2rem;
          text-align: center;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #1976d2;
          margin-bottom: 1rem;
        }
        .retry-button {
          background: #1976d2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }
        .retry-button:hover {
          background: #1565c0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📚</div>
        <h1>FindBook - Offline Mode</h1>
        <p>It looks like you're offline. Some features may not be available.</p>
        <p>Check your internet connection and try again.</p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
}

/**
 * Background sync for queued actions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('[ServiceWorker] Performing background sync');
    // Implementation for syncing queued actions when online
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');

    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification from FindBook',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/badge-72x72.png',
            data: data.data
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'FindBook', options)
        );
    }
});