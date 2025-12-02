import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CacheModule } from './cache/cache.module';
import { AuditModule } from './audit/audit.module';
import { LoggerModule } from './logger/logger.module';
import { UploadModule } from './upload/upload.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { CouponsModule } from './coupons/coupons.module';
import { CheckinModule } from './checkin/checkin.module';
import { HotelsModule } from './hotels/hotels.module';
import { PushModule } from './push/push.module';
import { RoomBlocksModule } from './room-blocks/room-blocks.module';
import { RedisThrottlerStorage } from './throttler/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000, // 1 minuto
            limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
          },
        ],
        storage: new RedisThrottlerStorage(),
      }),
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    CacheModule,
    AuditModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    ReservationsModule,
    PaymentsModule,
    NotificationsModule,
    UploadModule,
    ReviewsModule,
    ReportsModule,
    CouponsModule,
    CheckinModule,
    HotelsModule,
    PushModule,
    RoomBlocksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

