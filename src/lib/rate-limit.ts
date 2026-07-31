// In-memory sliding window rate limiter

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();


const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}


export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }


  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = windowMs - (now - oldestInWindow);
    return { success: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  };
}

