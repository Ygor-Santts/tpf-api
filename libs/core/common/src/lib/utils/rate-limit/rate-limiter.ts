// Counts hits per key in a sliding window. Kept in memory: there is one API
// process, and a restart just resets the counts.
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** True while the key is under the limit. Does not count a hit. */
  allows(key: string): boolean {
    return this.recent(key).length < this.limit;
  }

  /** Counts a hit and says whether it was still within the limit. */
  hit(key: string): boolean {
    const recent = this.recent(key);
    if (recent.length >= this.limit) return false;
    recent.push(Date.now());
    this.hits.set(key, recent);
    return true;
  }

  reset(key: string): void {
    this.hits.delete(key);
  }

  private recent(key: string): number[] {
    const now = Date.now();
    this.sweep(now);
    return (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
  }

  // Drops keys with no recent hits, so the map does not grow forever.
  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
    }
  }
}
