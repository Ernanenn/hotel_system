import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Room } from '../rooms/entities/room.entity';
import { RevenueGroupBy } from './dto/revenue-report.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let reservationsRepository: Repository<Reservation>;
  let paymentsRepository: Repository<Payment>;
  let roomsRepository: Repository<Room>;

  const mockReservationsRepository = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockPaymentsRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockRoomsRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationsRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentsRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomsRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reservationsRepository = module.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    paymentsRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    roomsRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRevenueReport', () => {
    it('should return revenue report grouped by day', async () => {
      const mockReservations = [
        {
          id: 'res1',
          checkIn: new Date('2024-01-01'),
          totalPrice: 300,
          room: { number: '101', type: 'single' },
        },
        {
          id: 'res2',
          checkIn: new Date('2024-01-01'),
          totalPrice: 500,
          room: { number: '102', type: 'double' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRevenueReport({
        groupBy: RevenueGroupBy.DAY,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalRevenue).toBe(800);
      expect(result.summary.totalReservations).toBe(2);
    });

    it('should return revenue report grouped by month', async () => {
      const mockReservations = [
        {
          id: 'res1',
          checkIn: new Date('2024-01-15'),
          totalPrice: 300,
          room: { number: '101', type: 'single' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReservations),
      };

      mockReservationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRevenueReport({
        groupBy: RevenueGroupBy.MONTH,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
    });
  });

  describe('getStatistics', () => {
    it('should return general statistics', async () => {
      mockRoomsRepository.count.mockResolvedValue(10);
      mockReservationsRepository.count.mockResolvedValue(50);

      const mockPaymentsQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '15000' }),
      };

      const mockUniqueUsersQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '25' }),
      };

      const mockOccupancyQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockOccupancyReservationsQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockRoomsRatingQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ average: '4.5' }),
      };

      mockReservationsRepository.createQueryBuilder
        .mockReturnValueOnce(mockUniqueUsersQueryBuilder)
        .mockReturnValueOnce(mockOccupancyQueryBuilder);
      mockPaymentsRepository.createQueryBuilder.mockReturnValue(mockPaymentsQueryBuilder);
      mockRoomsRepository.createQueryBuilder.mockReturnValue(mockRoomsRatingQueryBuilder);

      const result = await service.getStatistics();

      expect(result).toHaveProperty('totalRooms');
      expect(result).toHaveProperty('totalReservations');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('averageRating');
      expect(result.totalRooms).toBe(10);
    });
  });

  describe('getOccupancyReport', () => {
    it('should return occupancy report', async () => {
      const mockReservations = [
        {
          id: 'res1',
          checkIn: new Date('2024-01-01'),
          checkOut: new Date('2024-01-05'),
          room: { id: 'room1', number: '101' },
        },
      ];

      const mockOccupancyQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReservations),
      };

      // Reset mocks before this test
      jest.clearAllMocks();
      
      const mockOccupancyForStatsQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      
      mockReservationsRepository.createQueryBuilder
        .mockReturnValueOnce(mockOccupancyQueryBuilder)
        .mockReturnValueOnce(mockOccupancyForStatsQueryBuilder);
      mockRoomsRepository.count.mockResolvedValue(10);
      
      const mockRoomsQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
        { id: 'room1', number: '101', type: 'single' },
        { id: 'room2', number: '102', type: 'double' },
        ]),
      };
      mockRoomsRepository.createQueryBuilder.mockReturnValue(mockRoomsQueryBuilder);

      const result = await service.getOccupancyReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toHaveProperty('rooms');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('period');
    });
  });

  describe('getPopularRooms', () => {
    it('should return popular rooms', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            room_id: 'room1',
            room_number: '101',
            reservation_count: '10',
          },
        ]),
      };

      mockRoomsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPopularRooms(5);

      expect(result).toHaveProperty('length');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
