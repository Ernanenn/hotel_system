import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { ReservationsService } from '../reservations/reservations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationStatus } from '../reservations/entities/reservation.entity';
import { PaymentStatus } from './entities/payment.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repository: Repository<Payment>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReservationsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockNotificationsService = {
    sendReservationConfirmation: jest.fn(),
  };

  const mockCouponsService = {
    incrementUsage: jest.fn(),
    findByCode: jest.fn(),
    applyCoupon: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:5173';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: CouponsService,
          useValue: mockCouponsService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should return mock checkout URL', async () => {
      const mockReservation = {
        id: 'res1',
        totalPrice: 300,
        room: { number: '101' },
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
        status: ReservationStatus.PENDING,
      };

      mockReservationsService.findOne.mockResolvedValue(mockReservation);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ id: 'pay1' });
      mockRepository.save.mockResolvedValue({ id: 'pay1', sessionId: 'session1' });

      const result = await service.createCheckoutSession('res1');

      expect(result).toContain('/reservations/res1/checkout');
      expect(result).toContain('sessionId=');
    });

    it('should throw BadRequestException if reservation is not pending', async () => {
      const mockReservation = {
        id: 'res1',
        status: ReservationStatus.CONFIRMED,
      };

      mockReservationsService.findOne.mockResolvedValue(mockReservation);

      await expect(service.createCheckoutSession('res1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return existing payment if already exists', async () => {
      const mockReservation = {
        id: 'res1',
        status: ReservationStatus.PENDING,
      };

      const mockPayment = {
        id: 'pay1',
        sessionId: 'session1',
        reservationId: 'res1',
      };

      mockReservationsService.findOne.mockResolvedValue(mockReservation);
      mockRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.createCheckoutSession('res1');

      expect(result).toContain('sessionId=');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('processPayment', () => {
    it('should process payment and update reservation', async () => {
      const mockReservation = {
        id: 'res1',
        status: ReservationStatus.PENDING,
        couponCode: 'DISCOUNT10',
      };

      const mockPayment = {
        id: 'pay1',
        sessionId: 'session1',
        reservationId: 'res1',
        status: PaymentStatus.PENDING,
        amount: 300,
      };

      mockRepository.findOne.mockResolvedValue(mockPayment);
      mockReservationsService.findOne.mockResolvedValue(mockReservation);
      mockCouponsService.findByCode.mockResolvedValue({ id: 'coupon1', code: 'DISCOUNT10' });
      mockCouponsService.applyCoupon.mockResolvedValue(undefined);
      mockRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });
      mockReservationsService.update.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      });

      await service.processMockPayment('res1', 'session1');

      expect(mockReservationsService.update).toHaveBeenCalled();
      expect(mockNotificationsService.sendReservationConfirmation).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.processMockPayment('res1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const mockPayments = [
        { id: 'pay1', status: PaymentStatus.COMPLETED },
        { id: 'pay2', status: PaymentStatus.PENDING },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPayments),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return payment if found', async () => {
      const mockPayment = {
        id: 'pay1',
        status: PaymentStatus.COMPLETED,
      };

      mockRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne('pay1');

      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
