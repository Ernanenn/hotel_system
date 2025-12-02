import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { addDays, startOfDay, isSameDay } from 'date-fns';

@Injectable()
export class CheckinSchedulerService {
  private readonly logger = new Logger(CheckinSchedulerService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Envia lembretes de check-in 1 dia antes
   * Executa diariamente às 9:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendCheckInReminders() {
    this.logger.log('Executando tarefa de lembretes de check-in...');

    try {
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const tomorrowEnd = addDays(tomorrow, 1);

      const reservations = await this.reservationsRepository.find({
        where: {
          status: ReservationStatus.CONFIRMED,
          checkIn: MoreThanOrEqual(tomorrow),
          checkedInAt: null,
        },
        relations: ['user', 'room'],
      });

      for (const reservation of reservations) {
        const checkInDate = startOfDay(new Date(reservation.checkIn));
        if (isSameDay(checkInDate, tomorrow)) {
          try {
            await this.notificationsService.sendCheckInReminder(reservation);
            this.logger.log(`Lembrete de check-in enviado para reserva ${reservation.id}`);
          } catch (error) {
            this.logger.error(
              `Erro ao enviar lembrete de check-in para reserva ${reservation.id}:`,
              error,
            );
          }
        }
      }

      this.logger.log(`Lembretes de check-in processados: ${reservations.length}`);
    } catch (error) {
      this.logger.error('Erro ao processar lembretes de check-in:', error);
    }
  }

  /**
   * Envia lembretes de check-out 1 dia antes
   * Executa diariamente às 9:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendCheckOutReminders() {
    this.logger.log('Executando tarefa de lembretes de check-out...');

    try {
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const tomorrowEnd = addDays(tomorrow, 1);

      const reservations = await this.reservationsRepository
        .createQueryBuilder('reservation')
        .where('reservation.status = :status', { status: ReservationStatus.CONFIRMED })
        .andWhere('reservation.checkOut >= :tomorrow', { tomorrow })
        .andWhere('reservation.checkedInAt IS NOT NULL')
        .andWhere('reservation.checkedOutAt IS NULL')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.room', 'room')
        .getMany();

      for (const reservation of reservations) {
        const checkOutDate = startOfDay(new Date(reservation.checkOut));
        if (isSameDay(checkOutDate, tomorrow)) {
          try {
            await this.notificationsService.sendCheckOutReminder(reservation);
            this.logger.log(`Lembrete de check-out enviado para reserva ${reservation.id}`);
          } catch (error) {
            this.logger.error(
              `Erro ao enviar lembrete de check-out para reserva ${reservation.id}:`,
              error,
            );
          }
        }
      }

      this.logger.log(`Lembretes de check-out processados: ${reservations.length}`);
    } catch (error) {
      this.logger.error('Erro ao processar lembretes de check-out:', error);
    }
  }
}

