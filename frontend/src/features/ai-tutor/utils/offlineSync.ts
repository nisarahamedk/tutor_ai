// src/features/ai-tutor/utils/offlineSync.ts
// Offline Sync Utilities for TASK-010

import type { OfflineAction, SyncStatus } from '../types/learning';

// IndexedDB setup for offline storage
const DB_NAME = 'LearningStoreOffline';
const DB_VERSION = 1;
const ACTIONS_STORE = 'offlineActions';
const PROGRESS_STORE = 'progressCache';

export class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.initializeDB();
    this.setupNetworkListeners();
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    try {
      // Skip IndexedDB initialization in test environment
      if (typeof indexedDB === 'undefined') {
        console.warn('IndexedDB not available, offline sync disabled');
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadOfflineActions();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create actions store
        if (!db.objectStoreNames.contains(ACTIONS_STORE)) {
          const actionsStore = db.createObjectStore(ACTIONS_STORE, { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('synced', 'synced');
        }
        
        // Create progress cache store
        if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
          const progressStore = db.createObjectStore(PROGRESS_STORE, { keyPath: 'key' });
          progressStore.createIndex('lastModified', 'lastModified');
        }
      };
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  }

  // Setup network event listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.processQueueWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  // Add action to offline queue
  public addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>): void {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: new Date().toISOString(),
      synced: false,
      retries: 0
    };

    this.syncQueue.push(offlineAction);
    this.saveActionToDB(offlineAction);
    
    if (this.isOnline) {
      this.processQueueWhenOnline();
    }
  }

  // Process queue when online
  public async processQueueWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifyStatusChange();

    try {
      const unsyncedActions = this.syncQueue.filter(action => !action.synced);
      
      for (const action of unsyncedActions) {
        try {
          await this.syncAction(action);
          action.synced = true;
          action.retries = 0;
          await this.updateActionInDB(action);
        } catch (error) {
          action.retries++;
          console.error(`Failed to sync action ${action.id}:`, error);
          
          // Remove action if too many retries
          if (action.retries >= 3) {
            await this.removeActionFromDB(action.id);
            this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
          } else {
            await this.updateActionInDB(action);
          }
        }
      }

      // Clean up synced actions
      this.syncQueue = this.syncQueue.filter(action => !action.synced);
      await this.cleanupSyncedActions();
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  // Sync individual action
  private async syncAction(action: OfflineAction): Promise<void> {
    // Simulate API call - in real implementation, this would call actual server endpoints
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate network issues occasionally
        if (Math.random() < 0.1) {
          reject(new Error('Network error'));
        } else {
          resolve();
        }
      }, 100 + Math.random() * 500); // Simulate network delay
    });
  }

  // Cache progress data for offline access
  public async cacheProgressData(key: string, data: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([PROGRESS_STORE], 'readwrite');
    const store = transaction.objectStore(PROGRESS_STORE);
    
    const cacheEntry = {
      key,
      data,
      lastModified: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Retrieve cached progress data
  public async getCachedProgressData(key: string): Promise<any | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction([PROGRESS_STORE], 'readonly');
    const store = transaction.objectStore(PROGRESS_STORE);

    return new Promise<any | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get sync status
  public getSyncStatus(): SyncStatus {
    return {
      lastSyncTime: this.getLastSyncTime(),
      pendingActions: this.syncQueue.filter(action => !action.synced).length,
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      syncErrors: this.getSyncErrors()
    };
  }

  // Add sync status listener
  public addSyncStatusListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.add(listener);
  }

  // Remove sync status listener
  public removeSyncStatusListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.delete(listener);
  }

  // Load offline actions from DB
  private async loadOfflineActions(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE], 'readonly');
    const store = transaction.objectStore(ACTIONS_STORE);
    const index = store.index('synced');

    const request = index.getAll(false); // Get unsynced actions

    request.onsuccess = () => {
      this.syncQueue = request.result || [];
      this.notifyStatusChange();
      
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processQueueWhenOnline();
      }
    };
  }

  // Save action to DB
  private async saveActionToDB(action: OfflineAction): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(ACTIONS_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Update action in DB
  private async updateActionInDB(action: OfflineAction): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(ACTIONS_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Remove action from DB
  private async removeActionFromDB(actionId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(ACTIONS_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(actionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup synced actions from DB
  private async cleanupSyncedActions(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(ACTIONS_STORE);
    const index = store.index('synced');

    const request = index.openCursor(IDBKeyRange.only(true));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const action = cursor.value as OfflineAction;
        const actionAge = Date.now() - new Date(action.timestamp).getTime();
        
        // Remove synced actions older than 24 hours
        if (actionAge > 24 * 60 * 60 * 1000) {
          cursor.delete();
        }
        
        cursor.continue();
      }
    };
  }

  // Notify status change
  private notifyStatusChange(): void {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  // Generate unique action ID
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get last sync time
  private getLastSyncTime(): string | null {
    // In real implementation, this would be stored in localStorage or IndexedDB
    return localStorage.getItem('lastSyncTime');
  }

  // Set last sync time
  private setLastSyncTime(): void {
    localStorage.setItem('lastSyncTime', new Date().toISOString());
  }

  // Get sync errors
  private getSyncErrors(): string[] {
    const failedActions = this.syncQueue.filter(action => action.retries > 0);
    return failedActions.map(action => `Failed to sync ${action.type}: ${action.retries} retries`);
  }

  // Clear all offline data
  public async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([ACTIONS_STORE, PROGRESS_STORE], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(ACTIONS_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(PROGRESS_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);

    this.syncQueue = [];
    this.notifyStatusChange();
  }

  // Force sync all pending actions
  public async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.processQueueWhenOnline();
  }

  // Get offline storage size
  public async getOfflineStorageSize(): Promise<{ actions: number; cache: number }> {
    if (!this.db) return { actions: 0, cache: 0 };

    const transaction = this.db.transaction([ACTIONS_STORE, PROGRESS_STORE], 'readonly');
    
    const [actionsCount, cacheCount] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        const request = transaction.objectStore(ACTIONS_STORE).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise<number>((resolve, reject) => {
        const request = transaction.objectStore(PROGRESS_STORE).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ]);

    return { actions: actionsCount, cache: cacheCount };
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();

// Utility functions for common offline operations
export const createOfflineAction = (
  type: string,
  payload: any
): Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'> => ({
  type,
  payload
});

export const scheduleOfflineAction = (
  type: string,
  payload: any
): void => {
  offlineSyncManager.addOfflineAction(createOfflineAction(type, payload));
};

// Progress sync helpers
export const syncLessonProgress = (trackId: string, lessonId: string, progress: number): void => {
  scheduleOfflineAction('UPDATE_LESSON_PROGRESS', {
    trackId,
    lessonId,
    progress,
    timestamp: new Date().toISOString()
  });
};

export const syncTrackEnrollment = (trackId: string): void => {
  scheduleOfflineAction('ENROLL_IN_TRACK', {
    trackId,
    timestamp: new Date().toISOString()
  });
};

export const syncAssessmentResult = (assessmentId: string, result: any): void => {
  scheduleOfflineAction('SUBMIT_ASSESSMENT', {
    assessmentId,
    result,
    timestamp: new Date().toISOString()
  });
};

export const syncPreferencesUpdate = (preferences: any): void => {
  scheduleOfflineAction('UPDATE_PREFERENCES', {
    preferences,
    timestamp: new Date().toISOString()
  });
};

// Cache helpers
export const cacheTrackData = async (trackId: string, data: any): Promise<void> => {
  await offlineSyncManager.cacheProgressData(`track_${trackId}`, data);
};

export const getCachedTrackData = async (trackId: string): Promise<any | null> => {
  return await offlineSyncManager.getCachedProgressData(`track_${trackId}`);
};

export const cacheUserPreferences = async (preferences: any): Promise<void> => {
  await offlineSyncManager.cacheProgressData('user_preferences', preferences);
};

export const getCachedUserPreferences = async (): Promise<any | null> => {
  return await offlineSyncManager.getCachedProgressData('user_preferences');
};