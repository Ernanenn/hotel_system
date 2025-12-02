import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { ReservationsService } from '../reservations/reservations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { ReservationStatus } from '../reservations/entities/reservation.entity';
import { generateMockId } from '../common/utils';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private configService: ConfigService,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
    private notificationsService: NotificationsService,
    private couponsService: CouponsService,
  ) {}

  async createPaymentIntent(reservationId: string): Promise<Payment> {
    const reservation = await this.reservationsService.findOne(
      reservationId,
      undefined,
      'admin',
    );

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Reservation is not pending');
    }

    // Check if payment already exists
    let payment = await this.paymentsRepository.findOne({
      where: { reservationId },
    });

    if (payment) {
      return payment;
    }

    // Create mock payment intent ID
    const mockPaymentIntentId = generateMockId('mock_pi');

    // Create payment record
    payment = this.paymentsRepository.create({
      reservationId,
      amount: reservation.totalPrice,
      status: PaymentStatus.PENDING,
      paymentIntentId: mockPaymentIntentId,
      method: PaymentMethod.MOCK,
    });

    return this.paymentsRepository.save(payment);
  }

  async createCheckoutSession(reservationId: string): Promise<string> {
    const reservation = await this.reservationsService.findOne(
      reservationId,
      undefined,
      'admin',
    );

    const payment = await this.createPaymentIntent(reservationId);

    // Create mock session ID
    const mockSessionId = generateMockId('mock_session');
    payment.sessionId = mockSessionId;
    await this.paymentsRepository.save(payment);

    // Return mock checkout URL
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `${frontendUrl}/reservations/${reservationId}/checkout?sessionId=${mockSessionId}`;
  }

  async processMockPayment(reservationId: string, sessionId: string): Promise<void> {
    // Simula processamento de pagamento (delay de 2 segundos)
    const MOCK_PAYMENT_DELAY_MS = 2000;
    await new Promise((resolve) => setTimeout(resolve, MOCK_PAYMENT_DELAY_MS));

    const payment = await this.paymentsRepository.findOne({
      where: { reservationId, sessionId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Simula sucesso do pagamento
    await this.handlePaymentSuccess(reservationId);
  }

  /**
   * Webhook endpoint reservado para futuras integrações de gateway de pagamento
   * Atualmente não processa nenhum evento em modo mock
   */
  async handleWebhook(signature: string, body: any): Promise<void> {
    // Placeholder para futuras integrações
    console.log('Webhook received (not processed in mock mode)');
  }

  private async handlePaymentSuccess(reservationId: string): Promise<void> {
    const payment = await this.paymentsRepository.findOne({
      where: { reservationId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = PaymentStatus.COMPLETED;
    await this.paymentsRepository.save(payment);

    // Update reservation status
    await this.reservationsService.update(
      reservationId,
      { status: ReservationStatus.CONFIRMED },
      undefined,
      'admin',
    );

    // Get updated reservation with relations for email
    const reservation = await this.reservationsService.findOne(
      reservationId,
      undefined,
      'admin',
    );

    // Apply coupon if used
    if (reservation.couponCode) {
      try {
        const coupon = await this.couponsService.findByCode(reservation.couponCode);
        await this.couponsService.applyCoupon(coupon.id);
      } catch (error) {
        console.error('Error applying coupon:', error);
        // Don't throw - payment is already processed
      }
    }

    // Send confirmation email (with error handling)
    try {
      await this.notificationsService.sendReservationConfirmation(reservation);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw - payment is already processed
    }
  }

  async findAll(userId?: string, role?: string): Promise<Payment[]> {
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.reservation', 'reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.room', 'room');

    if (role !== 'admin' && userId) {
      query.where('user.id = :userId', { userId });
    }

    return query.orderBy('payment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['reservation', 'reservation.user', 'reservation.room'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }
}

