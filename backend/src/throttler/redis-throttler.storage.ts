import { ThrottlerStorage } from '@nestjs/throttler';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private redis: RedisClientType | null = null;
  private inMemoryStorage: Map<string, { hits: number; expiresAt: number }> = new Map();
  private useInMemory = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = createClient({
        url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              this.logger.warn('Redis connection failed after 3 retries. Using in-memory storage.');
              this.useInMemory = true;
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}. Using in-memory storage.`);
        this.useInMemory = true;
      });

      await this.redis.connect();
      this.logger.log('Redis connected successfully for rate limiting');
    } catch (err: any) {
      this.logger.warn(`Failed to connect to Redis: ${err.message}. Using in-memory storage.`);
      this.useInMemory = true;
    }
  }

  private isConnected(): boolean {
    return this.redis?.isReady === true && !this.useInMemory;
  }

  private incrementInMemory(key: string, ttl: number): ThrottlerStorageRecord {
    const now = Date.now();
    const record = this.inMemoryStorage.get(key);

    // Limpar registros expirados
    this.cleanExpiredRecords();

    if (!record || record.expiresAt <= now) {
      const expiresAt = now + ttl;
      this.inMemoryStorage.set(key, { hits: 1, expiresAt });
      return {
        totalHits: 1,
        timeToExpire: ttl,
      };
    }

    record.hits++;
    const remainingTtl = record.expiresAt - now;
    return {
      totalHits: record.hits,
      timeToExpire: remainingTtl > 0 ? remainingTtl : 0,
    };
  }

  private getRecordInMemory(key: string): ThrottlerStorageRecord {
    this.cleanExpiredRecords();
    const record = this.inMemoryStorage.get(key);
    if (!record) {
      return {
        totalHits: 0,
        timeToExpire: 0,
      };
    }

    const now = Date.now();
    if (record.expiresAt <= now) {
      this.inMemoryStorage.delete(key);
      return {
        totalHits: 0,
        timeToExpire: 0,
      };
    }

    const remainingTtl = record.expiresAt - now;
    return {
      totalHits: record.hits,
      timeToExpire: remainingTtl > 0 ? remainingTtl : 0,
    };
  }

  private cleanExpiredRecords() {
    const now = Date.now();
    for (const [key, record] of this.inMemoryStorage.entries()) {
      if (record.expiresAt <= now) {
        this.inMemoryStorage.delete(key);
      }
    }
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    if (!this.isConnected() || this.useInMemory) {
      return this.incrementInMemory(key, ttl);
    }

    try {
      const count = await this.redis!.incr(key);
      if (count === 1) {
        await this.redis!.expire(key, Math.ceil(ttl / 1000));
      }
      const remainingTtl = await this.redis!.ttl(key);
      return {
        totalHits: count,
        timeToExpire: remainingTtl > 0 ? remainingTtl * 1000 : ttl,
      };
    } catch (error: any) {
      this.logger.warn(`Redis increment error: ${error.message}. Using in-memory storage.`);
      this.useInMemory = true;
      return this.incrementInMemory(key, ttl);
    }
  }

  async getRecord(key: string): Promise<ThrottlerStorageRecord> {
    if (!this.isConnected() || this.useInMemory) {
      return this.getRecordInMemory(key);
    }

    try {
      const count = await this.redis!.get(key);
      const ttl = await this.redis!.ttl(key);
      if (count && ttl > 0) {
        return {
          totalHits: parseInt(count, 10),
          timeToExpire: ttl * 1000,
        };
      }
      return {
        totalHits: 0,
        timeToExpire: 0,
      };
    } catch (error: any) {
      this.logger.warn(`Redis getRecord error: ${error.message}. Using in-memory storage.`);
      this.useInMemory = true;
      return this.getRecordInMemory(key);
    }
  }
}

