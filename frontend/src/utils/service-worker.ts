/**
 * Service Worker utilities for offline-first architecture
 */

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, prompt user to update
            if (confirm('New version available. Update now?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Send message to service worker
 */
export function sendMessageToServiceWorker(message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No service worker controller'));
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

/**
 * Cache management utilities
 */
export class ServiceWorkerCacheManager {
  /**
   * Clear specific cache
   */
  static async clearCache(cacheName: string): Promise<boolean> {
    try {
      return (await sendMessageToServiceWorker({
        type: 'CLEAR_CACHE',
        cacheName,
      })) as boolean;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Update cache with new data
   */
  static async updateCache(cacheName: string, url: string): Promise<boolean> {
    try {
      return (await sendMessageToServiceWorker({
        type: 'UPDATE_CACHE',
        cacheName,
        url,
      })) as boolean;
    } catch (error) {
      console.error('Failed to update cache:', error);
      return false;
    }
  }

  /**
   * Get cache size
   */
  static async getCacheSize(): Promise<number> {
    try {
      const result = await sendMessageToServiceWorker({
        type: 'GET_CACHE_SIZE',
      });
      return (result as { size?: number }).size || 0;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<boolean> {
    try {
      return (await sendMessageToServiceWorker({
        type: 'CLEAR_ALL_CACHES',
      })) as boolean;
    } catch (error) {
      console.error('Failed to clear all caches:', error);
      return false;
    }
  }
}

/**
 * Background sync utilities
 */
export class BackgroundSyncManager {
  /**
   * Register a background sync
   */
  static async registerSync(tag: string, data?: unknown): Promise<boolean> {
    try {
      return (await sendMessageToServiceWorker({
        type: 'REGISTER_SYNC',
        tag,
        data,
      })) as boolean;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Cancel a background sync
   */
  static async cancelSync(tag: string): Promise<boolean> {
    try {
      return (await sendMessageToServiceWorker({
        type: 'CANCEL_SYNC',
        tag,
      })) as boolean;
    } catch (error) {
      console.error('Failed to cancel background sync:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<unknown> {
    try {
      return await sendMessageToServiceWorker({
        type: 'GET_SYNC_STATUS',
      });
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }
}

/**
 * Push notification utilities
 */
export class PushNotificationManager {
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('No service worker registration');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return await subscription.unsubscribe();
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get push subscription
   */
  static async getSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return null;
      }

      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }
}

/**
 * Service worker event handlers
 */
export function setupServiceWorkerEventHandlers(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data);
        // Notify user about updated content
        break;

      case 'SYNC_COMPLETED':
        console.log('Background sync completed:', data);
        // Update UI to reflect synced data
        break;

      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        // Show offline ready notification
        break;

      case 'ERROR':
        console.error('Service worker error:', data);
        break;

      default:
        console.log('Unknown message from service worker:', event.data);
    }
  });

  // Listen for controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service worker controller changed');
    // Optionally reload the page to use the new service worker
  });
}

/**
 * Initialize service worker and related features
 */
export async function initializeServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Register service worker
  const registration = await registerServiceWorker();
  
  if (registration) {
    // Setup event handlers
    setupServiceWorkerEventHandlers();

    // Initialize background sync for critical actions
    await BackgroundSyncManager.registerSync('chat-messages');
    await BackgroundSyncManager.registerSync('progress-updates');
    await BackgroundSyncManager.registerSync('assessment-submissions');

    console.log('Service worker initialized successfully');
  }
}

/**
 * Hook for using service worker features in React components
 */
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsSupported('serviceWorker' in navigator);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setIsRegistered(!!reg);
        setRegistration(reg || null);
      });
    }
  }, []);

  return {
    isSupported,
    isRegistered,
    registration,
    register: registerServiceWorker,
    unregister: unregisterServiceWorker,
    cacheManager: ServiceWorkerCacheManager,
    syncManager: BackgroundSyncManager,
    pushManager: PushNotificationManager,
  };
}

// Required imports for React hooks
import { useState, useEffect } from 'react';