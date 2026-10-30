import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory sliding window rate limiter for security-sensitive endpoints (login, register, password recovery).
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipInTest?: boolean;
}) {
  const { windowMs, max, message = 'Too many requests. Please try again later.', skipInTest = true } = options;
  const store = new Map<string, RateLimitRecord>();

  // Periodically clean up stale rate limit entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 10000));

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Tests can skip rate limiter unless explicitly testing rate limits with X-Test-Rate-Limit header
    const isExplicitRateLimitTest = Boolean(req.headers['x-test-rate-limit']);
    if (skipInTest && process.env.NODE_ENV === 'test' && !isExplicitRateLimitTest) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds
      });
      return;
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    next();
  };
}

// Preset rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 requests per minute
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.'
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 requests per 15 minutes
  message: 'Too many password recovery requests. Please wait before requesting another reset.'
});

