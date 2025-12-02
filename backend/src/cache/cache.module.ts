import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        const client: RedisClientType = createClient({
          url: `redis://${redisPassword ? `:${redisPassword}@` : ''}${redisHost}:${redisPort}`,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 3) {
                console.warn('Redis connection failed after 3 retries. Cache will not be available.');
                return false;
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        client.on('error', (err) => {
          console.warn('Redis Client Error (cache may be affected):', err.message);
        });
        
        try {
          await client.connect();
          console.log('Redis connected successfully for cache');
        } catch (err: any) {
          console.warn('Failed to connect to Redis. Cache will not be available:', err.message);
          // Não lançar erro, apenas logar - a aplicação pode funcionar sem cache
        }

        return client;
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}

