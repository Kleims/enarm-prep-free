// ENARM Prep - Service Worker for Offline Functionality
const CACHE_NAME = 'enarm-prep-v1.0.0';
const STATIC_CACHE_NAME = 'enarm-prep-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'enarm-prep-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/enarm-prep/',
  '/enarm-prep/index.html',
  '/enarm-prep/css/main.css',
  '/enarm-prep/css/responsive.css',
  '/enarm-prep/js/app.js',
  '/enarm-prep/js/questions.js',
  '/enarm-prep/js/progress.js',
  '/enarm-prep/js/utils.js',
  '/enarm-prep/data/questions.json',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// Dynamic resources that should be cached when accessed
const DYNAMIC_ASSETS = [
  '/enarm-prep/pages/',
  '/enarm-prep/assets/'
];

// Resources that should always be fetched from network
const NETWORK_ONLY = [
  '/enarm-prep/api/',
  'https://api.',
  'chrome-extension://'
];

// Maximum number of dynamic cache entries
const MAX_CACHE_SIZE = 50;

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
          cache: 'no-cache'
        })));
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                (cacheName.startsWith('enarm-prep-static-') || 
                 cacheName.startsWith('enarm-prep-dynamic-') ||
                 cacheName.startsWith('enarm-prep-v'))) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Handle different request types
  if (shouldSkipCache(event.request.url)) {
    // Network only for certain resources
    event.respondWith(fetch(event.request));
  } else if (isStaticAsset(event.request.url)) {
    // Cache first for static assets
    event.respondWith(cacheFirst(event.request));
  } else if (isDynamicAsset(event.request.url)) {
    // Stale while revalidate for dynamic content
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    // Network first for other requests
    event.respondWith(networkFirst(event.request));
  }
});

// Caching Strategies
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return caches.match('/enarm-prep/index.html') || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Limit cache size
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_CACHE_SIZE);
      
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network first falling back to cache:', error);
    const cached = await caches.match(request);
    return cached || new Response('Offline - Content not available', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Helper Functions
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset.replace('/enarm-prep', ''))) ||
         url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.json') ||
         url.includes('chart.js');
}

function isDynamicAsset(url) {
  return DYNAMIC_ASSETS.some(asset => url.includes(asset));
}

function shouldSkipCache(url) {
  return NETWORK_ONLY.some(pattern => url.includes(pattern));
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  } else if (event.tag === 'sync-questions') {
    event.waitUntil(syncQuestions());
  }
});

// Sync functions
async function syncProgress() {
  try {
    // Get offline progress data from IndexedDB or localStorage
    const offlineProgress = getOfflineProgress();
    
    if (offlineProgress && offlineProgress.length > 0) {
      // Send to server when back online
      const response = await fetch('/enarm-prep/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineProgress)
      });
      
      if (response.ok) {
        // Clear offline progress after successful sync
        clearOfflineProgress();
        console.log('Service Worker: Progress synced successfully');
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync progress', error);
  }
}

async function syncQuestions() {
  try {
    // Check for updated questions
    const response = await fetch('/enarm-prep/api/questions/updated');
    if (response.ok) {
      const updatedQuestions = await response.json();
      
      // Update cache with new questions
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put('/enarm-prep/data/questions.json', 
        new Response(JSON.stringify(updatedQuestions), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      console.log('Service Worker: Questions updated');
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'QUESTIONS_UPDATED',
          data: updatedQuestions
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync questions', error);
  }
}

// Push Notifications for study reminders
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'ENARM Prep',
    body: '¡Es hora de estudiar! Practica algunas preguntas.',
    icon: '/enarm-prep/assets/icons/icon-192x192.png',
    badge: '/enarm-prep/assets/icons/badge-72x72.png',
    tag: 'study-reminder',
    data: {
      url: '/enarm-prep/#practice'
    },
    actions: [
      {
        action: 'study',
        title: 'Estudiar Ahora'
      },
      {
        action: 'later',
        title: 'Más Tarde'
      }
    ],
    requireInteraction: true
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'study') {
    event.waitUntil(
      clients.openWindow('/enarm-prep/#practice')
    );
  } else if (event.action === 'later') {
    // Schedule another reminder in 30 minutes
    scheduleReminder(30);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Check if app is already open
          for (let client of clientList) {
            if (client.url.includes('/enarm-prep') && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if not already open
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data?.url || '/enarm-prep/');
          }
        })
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'REQUEST_UPDATE') {
    // Check for updates
    self.registration.update();
  } else if (event.data.type === 'CACHE_QUESTIONS') {
    // Manually cache questions
    event.waitUntil(cacheQuestions(event.data.questions));
  }
});

// Utility functions for offline data management
function getOfflineProgress() {
  // This would typically use IndexedDB for larger datasets
  try {
    const data = localStorage.getItem('enarm-offline-progress');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline progress:', error);
    return [];
  }
}

function clearOfflineProgress() {
  try {
    localStorage.removeItem('enarm-offline-progress');
  } catch (error) {
    console.error('Failed to clear offline progress:', error);
  }
}

async function cacheQuestions(questions) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    await cache.put('/enarm-prep/data/questions.json', 
      new Response(JSON.stringify(questions), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    console.log('Service Worker: Questions cached manually');
  } catch (error) {
    console.error('Service Worker: Failed to cache questions', error);
  }
}

function scheduleReminder(minutes) {
  // In a real implementation, this would use the server to schedule
  console.log(`Reminder scheduled for ${minutes} minutes`);
}

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'daily-sync') {
      event.waitUntil(
        Promise.all([
          syncProgress(),
          syncQuestions()
        ])
      );
    }
  });
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
});

console.log('Service Worker: Registered successfully');