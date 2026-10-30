/**
 * Notification Deduplication Engine
 * Suppresses repetitive alerts for the same disaster event or geofenced zone within a sliding window.
 */

interface DeduplicationEntry {
  timestamp: number;
  count: number;
}

export class NotificationDeduplicator {
  private cache = new Map<string, DeduplicationEntry>();

  constructor(private windowMs = 15 * 60 * 1000) {}

  /**
   * Checks whether the notification is a duplicate within the cooldown window.
   * If not duplicate, registers it and returns false.
   * If duplicate, increments counter and returns true.
   */
  public isDuplicate(key: string): boolean {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing && now - existing.timestamp < this.windowMs) {
      existing.count++;
      return true;
    }

    this.cache.set(key, { timestamp: now, count: 1 });
    return false;
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): { trackedKeys: number } {
    return { trackedKeys: this.cache.size };
  }
}

export const notificationDeduplicator = new NotificationDeduplicator();
