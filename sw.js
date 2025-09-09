// ENARM Prep - Enhanced Service Worker for Offline Functionality
const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `enarm-prep-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `enarm-prep-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `enarm-prep-dynamic-v${CACHE_VERSION}`;
const QUESTIONS_CACHE_NAME = `enarm-prep-questions-v${CACHE_VERSION}`;

// Resources to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/responsive.css',
  './css/freemium.css',
  './js/constants.js',
  './js/error-handler.js',
  './js/common-utils.js',
  './js/dependency-manager.js', // NEW - Dependency management
  './js/data-integrity.js', // NEW - Data integrity security
  './js/dom-sanitizer.js', // NEW - XSS prevention
  './js/data-validator.js', // NEW - Security module
  './js/performance-optimizer.js', // NEW - Performance module
  './js/storage-service.js',
  './js/theme-manager.js',
  './js/navigation-manager.js',
  './js/timer-service.js',
  './js/session-manager.js',
  './js/freemium-manager.js',
  './js/practice-mode-controller.js',
  './js/question-display-controller.js',
  './js/achievement-manager.js',
  './js/chart-service.js',
  './js/analytics-calculator.js',
  './js/question-filter-service.js',
  './js/performance-manager.js',
  './js/questions.js',
  './js/progress.js',
  './js/utils.js',
  './js/app.js',
  './js/app-initializer.js', // NEW - Safe application initialization
  './js/test-runner.js', // NEW - Testing module
  './js/monitoring-dashboard.js', // NEW - Monitoring module
  './js/progressive-enhancement.js', // NEW - Enhancement module
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// Dynamic resources that should be cached when accessed
const DYNAMIC_ASSETS = [
  './pages/',
  './assets/'
];

// Resources that should always be fetched from network
const NETWORK_ONLY = [
  './api/',
  'https://api.',
  'chrome-extension://'
];

// Cache size limits for different types
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_QUESTIONS_CACHE_SIZE = 10; // Different question sets
const CACHE_EXPIRY_DAYS = 7; // Days before cache expires

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
  } else if (isQuestionRequest(event.request.url)) {
    // Smart caching for questions with validation
    event.respondWith(smartQuestionCache(event.request));
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
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
      
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

// Smart Question Caching Strategy
async function smartQuestionCache(request) {
  try {
    const cache = await caches.open(QUESTIONS_CACHE_NAME);
    const cached = await cache.match(request);
    
    // Check if cached version is still fresh
    if (cached) {
      const cacheDate = cached.headers.get('sw-cached-date');
      if (cacheDate) {
        const cachedTime = new Date(cacheDate).getTime();
        const now = Date.now();
        const daysSinceCached = (now - cachedTime) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCached < CACHE_EXPIRY_DAYS) {
          console.log('Service Worker: Returning fresh cached questions');
          return cached;
        }
      }
    }
    
    // Fetch fresh questions and validate
    console.log('Service Worker: Fetching fresh questions');
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const responseText = await networkResponse.text();
      
      // Basic validation - ensure it's valid JSON
      try {
        const questions = JSON.parse(responseText);
        
        if (Array.isArray(questions) && questions.length > 0) {
          // Create enhanced response with timestamp
          const enhancedResponse = new Response(responseText, {
            headers: {
              ...networkResponse.headers,
              'sw-cached-date': new Date().toISOString(),
              'sw-validated': 'true'
            }
          });
          
          // Cache the validated questions
          await limitCacheSize(QUESTIONS_CACHE_NAME, MAX_QUESTIONS_CACHE_SIZE);
          cache.put(request, enhancedResponse.clone());
          
          return enhancedResponse;
        } else {
          throw new Error('Invalid questions format');
        }
      } catch (parseError) {
        console.error('Service Worker: Invalid questions data, using cache fallback');
        return cached || createOfflineFallback();
      }
    }
    
    return cached || createOfflineFallback();
  } catch (error) {
    console.error('Service Worker: Question cache failed:', error);
    const cache = await caches.open(QUESTIONS_CACHE_NAME);
    const cached = await cache.match(request);
    return cached || createOfflineFallback();
  }
}

function createOfflineFallback() {
  const fallbackQuestions = [
    {
      id: 'offline_fallback_1',
      category: 'Medicina General',
      difficulty: 'basico',
      question: '¿Cuál es la frecuencia cardíaca normal en reposo para un adulto sano?',
      options: {
        A: '40-60 lpm',
        B: '60-100 lpm',
        C: '100-120 lpm',
        D: '120-140 lpm'
      },
      correct: 'B',
      explanation: 'La frecuencia cardíaca normal en reposo para adultos es de 60-100 latidos por minuto.',
      reference: 'Guías básicas de fisiología cardiovascular'
    }
  ];
  
  return new Response(JSON.stringify(fallbackQuestions), {
    headers: {
      'Content-Type': 'application/json',
      'sw-fallback': 'true'
    }
  });
}

// Helper Functions
function isQuestionRequest(url) {
  return url.includes('questions.json') || url.includes('/data/');
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => {
    const normalizedAsset = asset.replace('./', '').replace('/enarm-prep/', '');
    return url.includes(normalizedAsset);
  }) ||
  url.includes('.css') || 
  url.includes('.js') ||
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