import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservations/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import * as QRCode from 'qrcode';
import { generateMockId } from '../common/utils';
import { ValidateQrCodeDto } from './dto/validate-qrcode.dto';

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private notificationsService: NotificationsService,
  ) {}

  async generateQrCode(
    reservationId: string,
    userId?: string,
    role?: string,
  ): Promise<{ qrCodeDataUrl: string; token: string }> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id: reservationId },
      relations: ['user', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Verificar se o usuário é o dono da reserva ou admin
    if (role !== 'admin' && reservation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Reservation must be confirmed to generate QR code');
    }

    try {
      // Gerar token único se não existir
      if (!reservation.qrCodeToken) {
        reservation.qrCodeToken = generateMockId('qr');
        await this.reservationsRepository.save(reservation);
        this.logger.log(`QR code token gerado para reserva ${reservationId}: ${reservation.qrCodeToken}`);
      }

      // Criar payload do QR code
      const qrPayload = JSON.stringify({
        reservationId: reservation.id,
        token: reservation.qrCodeToken,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
      });

      // Gerar QR code como data URL (imagem base64)
      const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      this.logger.log(`QR code gerado com sucesso para reserva ${reservationId}`);

      return {
        qrCodeDataUrl,
        token: reservation.qrCodeToken,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar QR code para reserva ${reservationId}:`, error);
      throw new BadRequestException(
        `Erro ao gerar QR code: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  async validateQrCode(dto: ValidateQrCodeDto): Promise<{
    valid: boolean;
    reservation?: Reservation;
    message?: string;
  }> {
    const reservation = await this.reservationsRepository.findOne({
      where: { qrCodeToken: dto.token },
      relations: ['user', 'room', 'payment'],
    });

    if (!reservation) {
      return {
        valid: false,
        message: 'QR code inválido ou reserva não encontrada',
      };
    }

    // Verificar se a reserva está confirmada
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      return {
        valid: false,
        message: 'Reserva não está confirmada',
      };
    }

    // Verificar se já passou do check-in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(reservation.checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    if (today < checkInDate) {
      return {
        valid: false,
        message: 'Check-in ainda não está disponível',
      };
    }

    // Verificar se já passou do check-out
    const checkOutDate = new Date(reservation.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);

    if (today > checkOutDate) {
      return {
        valid: false,
        message: 'Período de check-in expirado',
      };
    }

    return {
      valid: true,
      reservation,
    };
  }

  async performCheckIn(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id: reservationId },
      relations: ['user', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.checkedInAt) {
      throw new BadRequestException('Check-in já foi realizado');
    }

    reservation.checkedInAt = new Date();
    const updated = await this.reservationsRepository.save(reservation);

    // Enviar notificação de check-in
    try {
      await this.notificationsService.sendCheckInConfirmation(updated);
    } catch (error) {
      console.error('Error sending check-in notification:', error);
    }

    return updated;
  }

  async performCheckOut(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id: reservationId },
      relations: ['user', 'room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!reservation.checkedInAt) {
      throw new BadRequestException('Check-in não foi realizado');
    }

    if (reservation.checkedOutAt) {
      throw new BadRequestException('Check-out já foi realizado');
    }

    reservation.checkedOutAt = new Date();
    reservation.status = ReservationStatus.COMPLETED;
    const updated = await this.reservationsRepository.save(reservation);

    // Enviar notificação de check-out
    try {
      await this.notificationsService.sendCheckOutConfirmation(updated);
    } catch (error) {
      console.error('Error sending check-out notification:', error);
    }

    return updated;
  }
}

