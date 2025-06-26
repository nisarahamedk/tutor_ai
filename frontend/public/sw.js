/**
 * Service Worker for AI Tutor - Offline-first architecture
 */

const CACHE_NAME = 'ai-tutor-v1';
const STATIC_CACHE = 'ai-tutor-static-v1';
const DYNAMIC_CACHE = 'ai-tutor-dynamic-v1';
const API_CACHE = 'ai-tutor-api-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/ai-tutor',
  '/manifest.json',
  '/offline.html',
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/chat\//,
  /\/api\/learning\//,
  /\/api\/progress\//,
  /\/api\/assessments\//,
  /\/api\/preferences\//,
];

// Cache-first strategy patterns
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:js|css)$/,
  /\/api\/learning\/tracks/,
];

// Network-first strategy patterns
const NETWORK_FIRST_PATTERNS = [
  /\/api\/chat\//,
  /\/api\/progress\//,
  /\/api\/assessments\/submit/,
];

/**
 * Install event - cache static resources
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static resources');
      return cache.addAll(STATIC_RESOURCES);
    }).then(() => {
      console.log('Service Worker: Static resources cached');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isCacheFirst(url)) {
    event.respondWith(handleCacheFirst(request));
  } else if (isNetworkFirst(url)) {
    event.respondWith(handleNetworkFirst(request));
  } else {
    event.respondWith(handleDefault(request));
  }
});

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'chat-messages':
      event.waitUntil(syncChatMessages());
      break;
    case 'progress-updates':
      event.waitUntil(syncProgressUpdates());
      break;
    case 'assessment-submissions':
      event.waitUntil(syncAssessmentSubmissions());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

/**
 * Push event - handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AI Tutor', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

/**
 * Message event - handle messages from main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      handleClearCache(event, data.cacheName);
      break;
    case 'UPDATE_CACHE':
      handleUpdateCache(event, data.cacheName, data.url);
      break;
    case 'GET_CACHE_SIZE':
      handleGetCacheSize(event);
      break;
    case 'CLEAR_ALL_CACHES':
      handleClearAllCaches(event);
      break;
    case 'REGISTER_SYNC':
      handleRegisterSync(event, data.tag, data.data);
      break;
    case 'CANCEL_SYNC':
      handleCancelSync(event, data.tag);
      break;
    case 'GET_SYNC_STATUS':
      handleGetSyncStatus(event);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Helper functions

function isStaticResource(url) {
  return STATIC_RESOURCES.some(resource => url.pathname.startsWith(resource));
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

async function handleStaticResource(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Error handling static resource:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Use appropriate strategy based on endpoint
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkFirst(request);
  } else {
    return handleCacheFirst(request);
  }
}

async function handleCacheFirst(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Error in cache-first strategy:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

async function handleDefault(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Default handler failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// Sync functions

async function syncChatMessages() {
  try {
    // Get pending chat messages from IndexedDB
    // This would integrate with the offline storage system
    console.log('Syncing chat messages...');
    
    // Notify main thread that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        data: { tag: 'chat-messages' }
      });
    });
  } catch (error) {
    console.error('Chat message sync failed:', error);
  }
}

async function syncProgressUpdates() {
  try {
    console.log('Syncing progress updates...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        data: { tag: 'progress-updates' }
      });
    });
  } catch (error) {
    console.error('Progress sync failed:', error);
  }
}

async function syncAssessmentSubmissions() {
  try {
    console.log('Syncing assessment submissions...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        data: { tag: 'assessment-submissions' }
      });
    });
  } catch (error) {
    console.error('Assessment sync failed:', error);
  }
}

// Message handlers

async function handleClearCache(event, cacheName) {
  try {
    const success = await caches.delete(cacheName);
    event.ports[0].postMessage({ success });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

async function handleUpdateCache(event, cacheName, url) {
  try {
    const cache = await caches.open(cacheName);
    await cache.add(url);
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

async function handleGetCacheSize(event) {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      totalSize += requests.length;
    }
    
    event.ports[0].postMessage({ size: totalSize });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

async function handleClearAllCaches(event) {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

function handleRegisterSync(event, tag, data) {
  try {
    // In a real implementation, this would store the sync data
    // and register the sync event
    console.log('Registering sync:', tag);
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

function handleCancelSync(event, tag) {
  try {
    console.log('Canceling sync:', tag);
    event.ports[0].postMessage({ success: true });
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}

function handleGetSyncStatus(event) {
  try {
    const status = {
      pending: [],
      completed: [],
      failed: [],
    };
    event.ports[0].postMessage(status);
  } catch (error) {
    event.ports[0].postMessage({ error: error.message });
  }
}