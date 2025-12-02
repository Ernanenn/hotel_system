import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly defaultTtl = 300; // 5 minutos em segundos

  constructor(@Inject('REDIS_CLIENT') private redisClient: RedisClientType) {}

  /**
   * Obtém um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redisClient.isReady) {
        return null;
      }
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // Silenciosamente retorna null se Redis não estiver disponível
      return null;
    }
  }

  /**
   * Define um valor no cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.redisClient.isReady) {
        return; // Silenciosamente ignora se Redis não estiver disponível
      }
      const serialized = JSON.stringify(value);
      const expiration = ttl || this.defaultTtl;
      await this.redisClient.setEx(key, expiration, serialized);
    } catch (error) {
      // Silenciosamente ignora erros de cache
    }
  }

  /**
   * Remove um valor do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  /**
   * Limpa todo o cache (apenas chaves com prefixo)
   */
  async reset(prefix?: string): Promise<void> {
    try {
      if (prefix) {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        await this.redisClient.flushAll();
      }
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }

  /**
   * Gera uma chave de cache padronizada
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  onModuleDestroy() {
    this.redisClient.quit().catch(console.error);
  }
}

