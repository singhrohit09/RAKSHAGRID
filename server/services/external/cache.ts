/**
 * In-Memory TTL Cache for External Telemetry & Weather API Responses
 * Supports stale-while-revalidate pattern to maintain high availability during upstream outages.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAfter: number;
  cachedAt: number;
}

export class ExternalDataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  constructor(private defaultTtlMs = 10 * 60 * 1000, private maxStaleGraceMs = 30 * 60 * 1000) {}

  public get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now <= entry.expiresAt) {
      this.hits++;
      return { data: entry.data, isStale: false };
    }

    // Allow graceful fallback to stale data within grace period
    if (now <= entry.staleAfter) {
      this.hits++;
      return { data: entry.data, isStale: true };
    }

    // Expired past grace period
    this.cache.delete(key);
    this.misses++;
    return null;
  }

  public set(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const effectiveTtl = ttlMs || this.defaultTtlMs;
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + effectiveTtl,
      staleAfter: now + effectiveTtl + this.maxStaleGraceMs
    });
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Number((this.hits / total).toFixed(2)) : 0
    };
  }
}
