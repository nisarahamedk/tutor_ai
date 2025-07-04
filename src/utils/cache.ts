import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

// Cache tags for different data types
export const CACHE_TAGS = {
  LEARNING_TRACKS: 'learning-tracks',
  USER_PROGRESS: 'user-progress',
  ASSESSMENTS: 'assessments',
  USER_PREFERENCES: 'user-preferences',
  CHAT_HISTORY: 'chat-history',
  RECOMMENDATIONS: 'recommendations',
  ANALYTICS: 'analytics',
} as const;

// Cache durations in seconds
export const CACHE_DURATIONS = {
  STATIC: 3600 * 24, // 24 hours for static content
  DYNAMIC: 300, // 5 minutes for dynamic content
  USER_SPECIFIC: 60, // 1 minute for user-specific data
  REAL_TIME: 10, // 10 seconds for real-time data
} as const;

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  learningTracks: {
    duration: CACHE_DURATIONS.STATIC,
    tags: [CACHE_TAGS.LEARNING_TRACKS],
  },
  userProgress: {
    duration: CACHE_DURATIONS.USER_SPECIFIC,
    tags: [CACHE_TAGS.USER_PROGRESS],
  },
  assessments: {
    duration: CACHE_DURATIONS.DYNAMIC,
    tags: [CACHE_TAGS.ASSESSMENTS],
  },
  userPreferences: {
    duration: CACHE_DURATIONS.USER_SPECIFIC,
    tags: [CACHE_TAGS.USER_PREFERENCES],
  },
  chatHistory: {
    duration: CACHE_DURATIONS.REAL_TIME,
    tags: [CACHE_TAGS.CHAT_HISTORY],
  },
  recommendations: {
    duration: CACHE_DURATIONS.DYNAMIC,
    tags: [CACHE_TAGS.RECOMMENDATIONS],
  },
  analytics: {
    duration: CACHE_DURATIONS.USER_SPECIFIC,
    tags: [CACHE_TAGS.ANALYTICS],
  },
} as const;

/**
 * Create a cached version of an API call
 */
export function createCachedFunction<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    keyPrefix: string;
    duration?: number;
    tags?: string[];
    revalidate?: number;
  }
): T {
  return unstable_cache(
    fn,
    [options.keyPrefix],
    {
      revalidate: options.duration || CACHE_DURATIONS.DYNAMIC,
      tags: options.tags || [],
    }
  ) as T;
}

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Invalidate cache for specific tags
   */
  static async invalidateTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }

  /**
   * Invalidate cache for specific paths
   */
  static async invalidatePaths(paths: string[]): Promise<void> {
    for (const path of paths) {
      revalidatePath(path);
    }
  }

  /**
   * Invalidate all learning-related cache
   */
  static async invalidateLearningCache(): Promise<void> {
    await this.invalidateTags([
      CACHE_TAGS.LEARNING_TRACKS,
      CACHE_TAGS.USER_PROGRESS,
      CACHE_TAGS.RECOMMENDATIONS,
    ]);
  }

  /**
   * Invalidate user-specific cache
   */
  static async invalidateUserCache(): Promise<void> {
    await this.invalidateTags([
      CACHE_TAGS.USER_PROGRESS,
      CACHE_TAGS.USER_PREFERENCES,
      CACHE_TAGS.CHAT_HISTORY,
      CACHE_TAGS.ANALYTICS,
    ]);
  }

  /**
   * Generate cache key with user context
   */
  static generateUserKey(baseKey: string, userId?: string): string {
    return userId ? `${baseKey}:${userId}` : baseKey;
  }

  /**
   * Get cache key for learning tracks
   */
  static getLearningTracksKey(filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): string {
    const baseKey = 'learning-tracks';
    if (!filters) return baseKey;

    const filterStr = Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return filterStr ? `${baseKey}:${filterStr}` : baseKey;
  }

  /**
   * Get cache key for user progress
   */
  static getUserProgressKey(userId: string, trackId?: string): string {
    const baseKey = `user-progress:${userId}`;
    return trackId ? `${baseKey}:${trackId}` : baseKey;
  }

  /**
   * Get cache key for assessments
   */
  static getAssessmentsKey(userId: string, trackId?: string): string {
    const baseKey = `assessments:${userId}`;
    return trackId ? `${baseKey}:${trackId}` : baseKey;
  }
}

/**
 * React cache for component-level caching
 */
export function useComponentCache<T>(): T | null {
  // This would be implemented with React's cache function
  // For now, return null to indicate loading state
  return null;
}

/**
 * Memory cache for client-side caching
 */
class MemoryCache {
  private cache = new Map<string, { value: unknown; expires: number }>();

  set(key: string, value: unknown, ttl: number = 300000): void { // 5 minutes default
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// Clean up expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 300000);
}

/**
 * Storage cache for persistent client-side caching
 */
export class StorageCache {
  private prefix: string;

  constructor(prefix: string = 'ai-tutor-cache') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set(key: string, value: unknown, ttl: number = 3600000): void { // 1 hour default
    if (typeof window === 'undefined') return;

    const expires = Date.now() + ttl;
    const item = { value, expires };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set storage cache:', error);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expires) {
        this.delete(key);
        return null;
      }

      return parsed.value as T;
    } catch (error) {
      console.warn('Failed to get storage cache:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to delete storage cache:', error);
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear storage cache:', error);
    }
  }

  cleanup(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (now > parsed.expires) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup storage cache:', error);
    }
  }
}

export const storageCache = new StorageCache();

// Clean up expired storage cache entries on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    storageCache.cleanup();
  });
}