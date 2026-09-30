import { Redis } from 'ioredis';
import { env } from './env.js';

let redisInstance: Redis | null = null;

try {
  redisInstance = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    },
  });

  redisInstance.on('error', (err: any) => {
    // Graceful warning for local environment without active Redis
    if (env.NODE_ENV !== 'test') {
      console.warn('Redis connection issue:', err.message);
    }
  });
} catch (err: any) {
  console.warn('Failed to initialize Redis client:', err.message);
}

export const redis = redisInstance;
