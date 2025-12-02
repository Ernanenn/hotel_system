import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from './entities/notification.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { NotificationsGateway } from './notifications.gateway';
import { formatCurrency } from '../common/utils';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private configService: ConfigService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Simula envio de email (modo mock para desenvolvimento)
   * Em produção, substitua por um serviço real de email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    type: NotificationType,
    relatedEntityId?: string,
  ): Promise<void> {
    try {
      // Simula delay de envio de email
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Log do email simulado (apenas para desenvolvimento)
      this.logger.log(`[MOCK EMAIL] Para: ${to}`);
      this.logger.log(`[MOCK EMAIL] Assunto: ${subject}`);
      this.logger.debug(`[MOCK EMAIL] Conteúdo: ${html.substring(0, 100)}...`);

      // Save notification record
      const notification = this.notificationsRepository.create({
        type,
        recipientEmail: to,
        message: subject,
        relatedEntityId,
      });
      await this.notificationsRepository.save(notification);
    } catch (error) {
      this.logger.error('Error processing email notification:', error);
    }
  }

  async notifyAdminNewReservation(reservation: Reservation): Promise<void> {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      
      // Check if relations are loaded
      if (!reservation.room || !reservation.user) {
        this.logger.warn('Reservation relations not loaded, skipping email notification');
        // Still send WebSocket notification
        this.notificationsGateway.notifyAdmin({
          type: 'new_reservation',
          reservation: {
            id: reservation.id,
            roomNumber: 'N/A',
            guestName: 'N/A',
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            totalPrice: reservation.totalPrice,
          },
        });
        return;
      }
      
      const formattedPrice = formatCurrency(reservation.totalPrice);

      const subject = `Nova Reserva - Quarto ${reservation.room.number}`;
      const html = `
        <h2>Nova Reserva Recebida</h2>
        <p><strong>Cliente:</strong> ${reservation.user.firstName} ${reservation.user.lastName}</p>
        <p><strong>Email:</strong> ${reservation.user.email}</p>
        <p><strong>Quarto:</strong> ${reservation.room.number} (${reservation.room.type})</p>
        <p><strong>Check-in:</strong> ${reservation.checkIn}</p>
        <p><strong>Check-out:</strong> ${reservation.checkOut}</p>
        <p><strong>Total:</strong> R$ ${formattedPrice}</p>
        <p><strong>Status:</strong> ${reservation.status}</p>
      `;

      await this.sendEmail(
        adminEmail,
        subject,
        html,
        NotificationType.RESERVATION_CREATED,
        reservation.id,
      );

      // Emit WebSocket event
      this.notificationsGateway.notifyAdmin({
        type: 'new_reservation',
        reservation: {
          id: reservation.id,
          roomNumber: reservation.room.number,
          guestName: `${reservation.user.firstName} ${reservation.user.lastName}`,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          totalPrice: reservation.totalPrice,
        },
      });
    } catch (error) {
      this.logger.error('Error notifying admin:', error);
      // Don't throw, just log the error
    }
  }

  async sendReservationConfirmation(reservation: Reservation): Promise<void> {
    try {
      // Check if relations are loaded
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const formattedPrice = formatCurrency(reservation.totalPrice);

      const subject = 'Confirmação de Reserva - Hotel';
      const html = `
        <h2>Reserva Confirmada!</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>Sua reserva foi confirmada com sucesso!</p>
        <h3>Detalhes da Reserva:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number} (${reservation.room.type})</li>
          <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
          <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
          <li><strong>Total Pago:</strong> R$ ${formattedPrice}</li>
        </ul>
        <p>Obrigado por escolher nosso hotel!</p>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.RESERVATION_CONFIRMED,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending reservation confirmation:', error);
      // Don't throw - just log the error
    }
  }

  async notifyReservationStatusChange(
    reservation: Reservation,
    newStatus: string,
  ): Promise<void> {
    try {
      // Check if relations are loaded
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const subject = `Atualização de Reserva - Status: ${newStatus}`;
      const html = `
        <h2>Atualização de Reserva</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>O status da sua reserva foi atualizado para: <strong>${newStatus}</strong></p>
        <h3>Detalhes da Reserva:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number}</li>
          <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
          <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
        </ul>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.EMAIL_SENT,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending status change notification:', error);
      // Don't throw - just log the error
    }
  }

  async notifyReservationCancelled(reservation: Reservation): Promise<void> {
    const subject = 'Reserva Cancelada';
    const html = `
      <h2>Reserva Cancelada</h2>
      <p>Olá ${reservation.user.firstName},</p>
      <p>Sua reserva foi cancelada.</p>
      <h3>Detalhes da Reserva Cancelada:</h3>
      <ul>
        <li><strong>Quarto:</strong> ${reservation.room.number}</li>
        <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
        <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
      </ul>
    `;

    await this.sendEmail(
      reservation.user.email,
      subject,
      html,
      NotificationType.RESERVATION_CANCELLED,
      reservation.id,
    );
  }

  async sendCheckInConfirmation(reservation: Reservation): Promise<void> {
    try {
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const subject = 'Check-in Realizado - Hotel';
      const html = `
        <h2>Check-in Confirmado!</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>Seu check-in foi realizado com sucesso!</p>
        <h3>Detalhes:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number} (${reservation.room.type})</li>
          <li><strong>Check-in:</strong> ${new Date(reservation.checkedInAt!).toLocaleString('pt-BR')}</li>
          <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
        </ul>
        <p>Bem-vindo ao nosso hotel! Desejamos uma ótima estadia!</p>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.CHECKIN_CONFIRMED,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending check-in confirmation:', error);
    }
  }

  async sendCheckOutConfirmation(reservation: Reservation): Promise<void> {
    try {
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const subject = 'Check-out Realizado - Hotel';
      const html = `
        <h2>Check-out Confirmado!</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>Seu check-out foi realizado com sucesso!</p>
        <h3>Detalhes:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number}</li>
          <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
          <li><strong>Check-out:</strong> ${new Date(reservation.checkedOutAt!).toLocaleString('pt-BR')}</li>
        </ul>
        <p>Obrigado por escolher nosso hotel! Esperamos vê-lo novamente em breve!</p>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.CHECKOUT_CONFIRMED,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending check-out confirmation:', error);
    }
  }

  async sendCheckInReminder(reservation: Reservation): Promise<void> {
    try {
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const subject = 'Lembrete de Check-in - Hotel';
      const html = `
        <h2>Lembrete de Check-in</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>Este é um lembrete de que seu check-in está agendado para <strong>${reservation.checkIn}</strong>.</p>
        <h3>Detalhes da Reserva:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number} (${reservation.room.type})</li>
          <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
          <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
        </ul>
        <p>Estamos ansiosos para recebê-lo!</p>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.CHECKIN_REMINDER,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending check-in reminder:', error);
    }
  }

  async sendCheckOutReminder(reservation: Reservation): Promise<void> {
    try {
      if (!reservation.user || !reservation.room) {
        this.logger.warn('Reservation relations not loaded, skipping email');
        return;
      }

      const subject = 'Lembrete de Check-out - Hotel';
      const html = `
        <h2>Lembrete de Check-out</h2>
        <p>Olá ${reservation.user.firstName},</p>
        <p>Este é um lembrete de que seu check-out está agendado para <strong>${reservation.checkOut}</strong>.</p>
        <h3>Detalhes da Reserva:</h3>
        <ul>
          <li><strong>Quarto:</strong> ${reservation.room.number}</li>
          <li><strong>Check-in:</strong> ${reservation.checkIn}</li>
          <li><strong>Check-out:</strong> ${reservation.checkOut}</li>
        </ul>
        <p>Por favor, certifique-se de fazer o check-out até às 12:00.</p>
      `;

      await this.sendEmail(
        reservation.user.email,
        subject,
        html,
        NotificationType.CHECKOUT_REMINDER,
        reservation.id,
      );
    } catch (error) {
      this.logger.error('Error sending check-out reminder:', error);
    }
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}

