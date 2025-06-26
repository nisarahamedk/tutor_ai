/**
 * Offline sync and storage utilities for AI Tutor
 */

export interface OfflineAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export interface OfflineData {
  learningProgress: Record<string, unknown>;
  chatHistory: Record<string, unknown[]>;
  userPreferences: unknown;
  assessmentAnswers: Record<string, unknown>;
  lastSync: number;
}

/**
 * IndexedDB wrapper for offline data storage
 */
class OfflineStorage {
  private dbName = 'ai-tutor-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires');
        }
      };
    });
  }

  async storeAction(action: OfflineAction): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.add(action);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async removeAction(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async storeData(key: string, data: unknown): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getData(key: string): Promise<unknown> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  }

  async storeCache(key: string, data: unknown, ttl: number): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const expires = Date.now() + ttl;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, data, expires });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCache(key: string): Promise<unknown> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (Date.now() > result.expires) {
          // Clean up expired cache
          this.removeCache(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  async removeCache(key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expires');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

/**
 * Offline sync manager
 */
export class OfflineSyncManager {
  private storage = new OfflineStorage();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress = false;
  private syncQueue: OfflineAction[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initEventListeners();
      this.storage.init();
    }
  }

  private initEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync attempt
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineActions();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Add an action to the offline queue
   */
  async queueAction(type: string, payload: unknown, maxRetries: number = 3): Promise<string> {
    const action: OfflineAction = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    };

    if (this.isOnline) {
      // Try to execute immediately if online
      try {
        await this.executeAction(action);
        return action.id;
      } catch (error) {
        console.warn('Failed to execute action immediately, queuing for later:', error);
      }
    }

    await this.storage.storeAction(action);
    return action.id;
  }

  /**
   * Execute a single offline action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    const { type, payload } = action;

    switch (type) {
      case 'SEND_MESSAGE':
        await this.syncChatMessage(payload);
        break;
      case 'UPDATE_PROGRESS':
        await this.syncProgress(payload);
        break;
      case 'SUBMIT_ASSESSMENT':
        await this.syncAssessment(payload);
        break;
      case 'UPDATE_PREFERENCES':
        await this.syncPreferences(payload);
        break;
      default:
        console.warn('Unknown action type:', type);
    }
  }

  /**
   * Sync all offline actions
   */
  async syncOfflineActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const actions = await this.storage.getActions();
      
      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.storage.removeAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          
          // Increment retry count
          action.retries++;
          
          if (action.retries >= action.maxRetries) {
            // Remove failed action after max retries
            await this.storage.removeAction(action.id);
            console.error('Action failed after max retries:', action.id);
          } else {
            // Update action with new retry count
            await this.storage.storeAction(action);
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync offline actions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync chat message
   */
  private async syncChatMessage(payload: unknown): Promise<void> {
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync chat message: ${response.statusText}`);
    }
  }

  /**
   * Sync progress update
   */
  private async syncProgress(payload: unknown): Promise<void> {
    const response = await fetch('/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync progress: ${response.statusText}`);
    }
  }

  /**
   * Sync assessment submission
   */
  private async syncAssessment(payload: unknown): Promise<void> {
    const response = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync assessment: ${response.statusText}`);
    }
  }

  /**
   * Sync preferences update
   */
  private async syncPreferences(payload: unknown): Promise<void> {
    const response = await fetch('/api/preferences/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync preferences: ${response.statusText}`);
    }
  }

  /**
   * Store data for offline use
   */
  async storeOfflineData(key: string, data: unknown): Promise<void> {
    await this.storage.storeData(key, data);
  }

  /**
   * Get offline data
   */
  async getOfflineData(key: string): Promise<unknown> {
    return await this.storage.getData(key);
  }

  /**
   * Get offline status
   */
  getOfflineStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    queuedActions: number;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queuedActions: this.syncQueue.length,
    };
  }

  /**
   * Force sync attempt
   */
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOfflineActions();
    }
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();

/**
 * Hook for using offline capabilities in React components
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    queueAction: offlineSyncManager.queueAction.bind(offlineSyncManager),
    forceSync: offlineSyncManager.forcSync.bind(offlineSyncManager),
    getStatus: offlineSyncManager.getOfflineStatus.bind(offlineSyncManager),
  };
}

// Required imports for React hooks
import { useState, useEffect } from 'react';