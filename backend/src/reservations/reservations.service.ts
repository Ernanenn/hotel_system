import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { RoomsService } from '../rooms/rooms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { TenantContextService } from '../hotels/services/tenant-context.service';
import { calculateNights, normalizeDate } from '../common/utils';

/**
 * Serviço para gerenciamento de reservas
 * 
 * Fornece funcionalidades para:
 * - Criação de reservas com validação de disponibilidade
 * - Aplicação de cupons de desconto
 * - Cálculo automático de preços
 * - Gerenciamento de status (pending, confirmed, cancelled, completed)
 * - Integração com sistema de pagamentos
 * - Geração de QR codes para check-in digital
 * 
 * @class ReservationsService
 */
@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private roomsService: RoomsService,
    private notificationsService: NotificationsService,
    private couponsService: CouponsService,
    private tenantContext: TenantContextService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: string,
  ): Promise<Reservation> {
    const { roomId, checkIn, checkOut } = createReservationDto;

    // Validate dates
    const checkInDate = normalizeDate(checkIn);
    const checkOutDate = normalizeDate(checkOut);
    const today = normalizeDate(new Date().toISOString().split('T')[0]);

    if (checkInDate < today) {
      throw new BadRequestException('Data de check-in não pode ser no passado');
    }

    if (checkOutDate <= checkInDate) {
      throw new BadRequestException(
        'Data de check-out deve ser posterior à data de check-in',
      );
    }

    // Check room availability
    const availableRooms = await this.roomsService.checkAvailability({
      checkIn,
      checkOut,
    });

    const room = availableRooms.find((r) => r.id === roomId);
    if (!room) {
      throw new BadRequestException('Room is not available for these dates');
    }

    // Calculate total price
    const nights = calculateNights(checkInDate, checkOutDate);
    let totalPrice = Number(room.pricePerNight) * nights;
    let discountAmount = 0;
    let couponCode = null;

    // Apply coupon if provided
    if (createReservationDto.couponCode) {
      try {
        const couponValidation = await this.couponsService.validateCoupon({
          code: createReservationDto.couponCode,
          totalAmount: totalPrice,
        });

        if (couponValidation.valid && couponValidation.discount) {
          discountAmount = couponValidation.discount;
          totalPrice = couponValidation.finalAmount || totalPrice - discountAmount;
          couponCode = createReservationDto.couponCode;
        }
      } catch (error) {
        // Se o cupom for inválido, continua sem desconto
        console.warn('Cupom inválido:', error);
        // Não lança erro, apenas ignora o cupom
      }
    }

    // Obter hotelId do contexto ou do quarto
    const hotelId = this.tenantContext.getHotelId() || room.hotelId;

    // Create reservation
    const reservation = this.reservationsRepository.create({
      roomId: createReservationDto.roomId,
      hotelId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestNotes: createReservationDto.guestNotes || null,
      userId,
      totalPrice,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || null,
      status: ReservationStatus.PENDING,
      // Campos de check-in serão preenchidos depois
      qrCodeToken: null,
      checkedInAt: null,
      checkedOutAt: null,
    });

    const savedReservation = await this.reservationsRepository.save(reservation);

    // Load relations for notification
    const reservationWithRelations = await this.reservationsRepository.findOne({
      where: { id: savedReservation.id },
      relations: ['room', 'user'],
    });

    // Notify admin
    if (reservationWithRelations) {
      await this.notificationsService.notifyAdminNewReservation(reservationWithRelations);
    }

    return savedReservation;
  }

  async findAll(userId?: string, role?: string): Promise<Reservation[]> {
    const query = this.reservationsRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.payment', 'payment');

    // Aplicar filtro de hotel automaticamente (exceto para admin)
    if (role !== 'admin') {
      this.tenantContext.applyHotelFilter(query);
    }

    if (role !== 'admin' && userId) {
      query.andWhere('reservation.userId = :userId', { userId });
    }

    return query
      .orderBy('reservation.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId?: string, role?: string): Promise<Reservation> {
    const where = this.tenantContext.applyHotelWhere({ id });
    const reservation = await this.reservationsRepository.findOne({
      where,
      relations: ['room', 'user', 'payment'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (role !== 'admin' && reservation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return reservation;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
    userId?: string,
    role?: string,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id, userId, role);

    if (role !== 'admin' && role !== undefined) {
      throw new ForbiddenException('Only admins can update reservations');
    }

    Object.assign(reservation, updateReservationDto);
    const updated = await this.reservationsRepository.save(reservation);

    // Notify user if status changed
    if (updateReservationDto.status) {
      // Reload reservation with relations for notification
      const reservationWithRelations = await this.reservationsRepository.findOne({
        where: { id: reservation.id },
        relations: ['room', 'user'],
      });
      
      if (reservationWithRelations) {
        try {
          await this.notificationsService.notifyReservationStatusChange(
            reservationWithRelations,
            updateReservationDto.status,
          );
        } catch (error) {
          console.error('Error sending status change notification:', error);
          // Don't throw - reservation is already updated
        }
      }
    }

    return updated;
  }

  async cancel(id: string, userId: string, role?: string): Promise<Reservation> {
    const reservation = await this.findOne(id, userId, role);

    if (role !== 'admin' && reservation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    reservation.status = ReservationStatus.CANCELLED;
    const cancelled = await this.reservationsRepository.save(reservation);

    await this.notificationsService.notifyReservationCancelled(cancelled);

    return cancelled;
  }
}

