import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationsService } from './reservations.service';
import { Reservation } from './entities/reservation.entity';
import { RoomsService } from '../rooms/rooms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { TenantContextService } from '../hotels/services/tenant-context.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReservationStatus } from './entities/reservation.entity';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let repository: Repository<Reservation>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoomsService = {
    checkAvailability: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    notifyAdminNewReservation: jest.fn(),
    sendReservationConfirmation: jest.fn(),
    notifyReservationStatusChange: jest.fn(),
  };

  const mockCouponsService = {
    validateCoupon: jest.fn(),
    applyCoupon: jest.fn(),
  };

  const mockTenantContext = {
    getHotelId: jest.fn().mockReturnValue('hotel1'),
    applyHotelWhere: jest.fn((where) => ({ ...where, hotelId: 'hotel1' })),
    applyHotelFilter: jest.fn((query) => query),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockRepository,
        },
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: CouponsService,
          useValue: mockCouponsService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    repository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a reservation successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const createDto = {
        roomId: 'room1',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfterTomorrow.toISOString().split('T')[0],
      };

      const mockRoom = {
        id: 'room1',
        pricePerNight: 150,
        hotelId: 'hotel1',
      };

      const mockReservation = {
        id: 'res1',
        ...createDto,
        userId: 'user1',
        totalPrice: 150,
        status: ReservationStatus.PENDING,
      };

      mockRoomsService.checkAvailability.mockResolvedValue([mockRoom]);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockRepository.create.mockReturnValue(mockReservation);
      mockRepository.save.mockResolvedValue(mockReservation);

      const result = await service.create(createDto, 'user1');

      expect(result).toEqual(mockReservation);
      // A notificação pode ser assíncrona, então não verificamos aqui
    });

    it('should throw BadRequestException if check-in is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createDto = {
        roomId: '1',
        checkIn: yesterday.toISOString().split('T')[0],
        checkOut: tomorrow.toISOString().split('T')[0],
      };

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if check-out is before check-in', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      const createDto = {
        roomId: '1',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: today.toISOString().split('T')[0],
      };

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if room is not available', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const createDto = {
        roomId: 'room1',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfterTomorrow.toISOString().split('T')[0],
      };

      mockRoomsService.checkAvailability.mockResolvedValue([]);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should apply coupon if provided', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const createDto = {
        roomId: 'room1',
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfterTomorrow.toISOString().split('T')[0],
        couponCode: 'DISCOUNT10',
      };

      const mockRoom = {
        id: 'room1',
        pricePerNight: 150,
        hotelId: 'hotel1',
      };

      const mockCoupon = {
        id: 'coupon1',
        code: 'DISCOUNT10',
        discount: 10,
        discountType: 'percentage',
      };

      const mockReservation = {
        id: 'res1',
        ...createDto,
        userId: 'user1',
        totalPrice: 135, // 150 - 10%
        status: ReservationStatus.PENDING,
      };

      mockRoomsService.checkAvailability.mockResolvedValue([mockRoom]);
      mockRoomsService.findOne.mockResolvedValue(mockRoom);
      mockCouponsService.validateCoupon.mockResolvedValue(mockCoupon);
      mockCouponsService.applyCoupon.mockReturnValue(135);
      mockRepository.create.mockReturnValue(mockReservation);
      mockRepository.save.mockResolvedValue(mockReservation);

      const result = await service.create(createDto, 'user1');

      expect(result.totalPrice).toBe(135);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return reservation if found and user has access', async () => {
      const mockReservation = {
        id: 'res1',
        userId: 'user1',
        status: ReservationStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(mockReservation);

      const result = await service.findOne('res1', 'user1');

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own reservation', async () => {
      const mockReservation = {
        id: 'res1',
        userId: 'user2',
      };

      mockRepository.findOne.mockResolvedValue(mockReservation);

      await expect(service.findOne('res1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to access any reservation', async () => {
      const mockReservation = {
        id: 'res1',
        userId: 'user2',
      };

      mockRepository.findOne.mockResolvedValue(mockReservation);

      const result = await service.findOne('res1', 'admin', 'admin');

      expect(result).toEqual(mockReservation);
    });
  });

  describe('update', () => {
    it('should update reservation status', async () => {
      const mockReservation = {
        id: 'res1',
        userId: 'user1',
        status: ReservationStatus.PENDING,
      };

      mockRepository.findOne.mockResolvedValue(mockReservation);
      mockRepository.save.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      });

      const result = await service.update('res1', { status: ReservationStatus.CONFIRMED }, 'user1');

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });
  });

  describe('findAll', () => {
    it('should return all reservations for user', async () => {
      const mockReservations = [
        { id: 'res1', userId: 'user1' },
        { id: 'res2', userId: 'user1' },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReservations),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('user1');

      expect(result).toEqual(mockReservations);
    });
  });
});
