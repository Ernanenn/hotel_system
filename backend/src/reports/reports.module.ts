import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Room } from '../rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Payment, Room])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

