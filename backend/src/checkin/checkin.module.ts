import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { CheckinSchedulerService } from './checkin-scheduler.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    NotificationsModule,
  ],
  controllers: [CheckinController],
  providers: [CheckinService, CheckinSchedulerService],
  exports: [CheckinService],
})
export class CheckinModule {}

