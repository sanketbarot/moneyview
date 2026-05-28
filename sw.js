/* ============================================================
   AITOOLCOR MONEYWISE - SERVICE WORKER
   File: sw.js
   Enables offline support + PWA caching
   ============================================================ */

const CACHE_NAME    = 'moneywise-v2.1.0';
const CACHE_URLS    = [
    '/',
    '/index.html',
    '/app.html',
    '/404.html',
    '/manifest.json',

    /* CSS */
    '/css/variables.css',
    '/css/global.css',
    '/css/glass.css',
    '/css/animations.css',
    '/css/auth.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/dashboard.css',
    '/css/transactions.css',
    '/css/budgets.css',
    '/css/goals.css',
    '/css/bills.css',
    '/css/accounts.css',
    '/css/reports.css',
    '/css/analytics.css',
    '/css/settings.css',
    '/css/charts.css',
    '/css/quickadd.css',
    '/css/responsive.css',

    /* JS */
    '/js/auth.js',
    '/js/app.js',
    '/js/store.js',
    '/js/categories.js',
    '/js/currency.js',
    '/js/utils.js',
    '/js/toast.js',
    '/js/modal.js',
    '/js/animations.js',
    '/js/charts.js',
    '/js/dashboard.js',
    '/js/transactions.js',
    '/js/budgets.js',
    '/js/goals.js',
    '/js/bills.js',
    '/js/accounts.js',
    '/js/reports.js',
    '/js/analytics.js',
    '/js/settings.js',
    '/js/export.js',
    '/js/quickadd.js',
    '/js/shortcuts.js',

    /* Assets */
    '/assets/favicon.svg'
];

/* ── INSTALL: Cache all files ── */
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Caching files');
                return cache.addAll(CACHE_URLS.map(url => new Request(url, {
                    cache: 'reload'
                })));
            })
            .then(() => self.skipWaiting())
            .catch(err => console.warn('SW: Cache error', err))
    );
});

/* ── ACTIVATE: Clean old caches ── */
self.addEventListener('activate', event => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('SW: Deleting old cache', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

/* ── FETCH: Cache first, network fallback ── */
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    /* Skip Firebase and external CDN requests */
    if (url.hostname !== self.location.hostname) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 ||
                            response.type !== 'basic') {
                            return response;
                        }

                        const cloned = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, cloned));

                        return response;
                    })
                    .catch(() => {
                        /* Offline fallback */
                        if (event.request.mode === 'navigate') {
                            return caches.match('/app.html');
                        }
                    });
            })
    );
});

/* ── MESSAGE: Force update ── */
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});