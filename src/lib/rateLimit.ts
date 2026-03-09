// In-memory rate limiter with configurable presets.
// For production at scale, consider Redis or a dedicated rate limiting service.

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Preset configurations for different endpoint types
export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60_000 },       // 5 req/min
  orderCreate: { maxRequests: 10, windowMs: 60_000 },// 10 req/min
  rewardValidate: { maxRequests: 10, windowMs: 60_000 },// 10 req/min
  reviewSubmit: { maxRequests: 5, windowMs: 60_000 },// 5 req/min
  fileUpload: { maxRequests: 10, windowMs: 60_000 }, // 10 req/min
  payment: { maxRequests: 5, windowMs: 60_000 },     // 5 req/min
  default: { maxRequests: 30, windowMs: 60_000 },    // 30 req/min
} as const;

/**
 * Check rate limit for a given identifier.
 * @param identifier - Unique key (e.g., "auth:ip:userId")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMITS.default.maxRequests,
  windowMs: number = RATE_LIMITS.default.windowMs
): boolean {
  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Build a composite rate limit key from IP and optional user ID.
 */
export function rateLimitKey(prefix: string, ip: string, userId?: string): string {
  return userId ? `${prefix}:${ip}:${userId}` : `${prefix}:${ip}`;
}

// Clean up stale entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  const maxWindow = 120_000; // 2 minutes - covers all presets

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < maxWindow);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 120_000);
