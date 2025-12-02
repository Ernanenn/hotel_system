import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { RoomBlock } from '../room-blocks/entities/room-block.entity';
import { TenantContextService } from '../hotels/services/tenant-context.service';
import { NotFoundException } from '@nestjs/common';
import { SortBy, SortOrder } from './dto/search-rooms.dto';

describe('RoomsService', () => {
  let service: RoomsService;
  let repository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let cacheManager: any;
  let tenantContext: TenantContextService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
    },
  };

  const mockRoomBlockRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockTenantContext = {
    getHotelId: jest.fn().mockReturnValue('hotel1'),
    applyHotelWhere: jest.fn((where) => ({ ...where, hotelId: 'hotel1' })),
    applyHotelFilter: jest.fn((query) => query.andWhere('room.hotelId = :hotelId', { hotelId: 'hotel1' })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RoomBlock),
          useValue: mockRoomBlockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    repository = module.get<Repository<Room>>(getRepositoryToken(Room));
    roomBlockRepository = module.get<Repository<RoomBlock>>(getRepositoryToken(RoomBlock));
    cacheManager = module.get(CACHE_MANAGER);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a room', async () => {
      const createDto = {
        number: '101',
        type: 'single' as any,
        pricePerNight: 150,
        hotelId: 'hotel1',
      };
      const mockRoom = { id: '1', ...createDto };

      mockRepository.create.mockReturnValue(mockRoom);
      mockRepository.save.mockResolvedValue(mockRoom);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRoom);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should apply hotelId from tenant context if not provided', async () => {
      const createDto = {
        number: '102',
        type: 'double' as any,
        pricePerNight: 220,
      };
      const mockRoom = { id: '2', ...createDto, hotelId: 'hotel1' };

      mockRepository.create.mockReturnValue(mockRoom);
      mockRepository.save.mockResolvedValue(mockRoom);

      await service.create(createDto);

      expect(mockTenantContext.getHotelId).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all rooms from cache if available', async () => {
      const mockRooms = [
        { id: '1', number: '101', type: 'single', pricePerNight: 150 },
        { id: '2', number: '102', type: 'double', pricePerNight: 220 },
      ];

      mockCacheManager.get.mockResolvedValue(mockRooms);

      const result = await service.findAll();

      expect(result).toEqual(mockRooms);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockRooms = [
        { id: '1', number: '101', type: 'single', pricePerNight: 150 },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(mockRooms);

      const result = await service.findAll();

      expect(result).toEqual(mockRooms);
      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search rooms with filters', async () => {
      const searchDto = {
        type: 'single' as any,
        minPrice: 100,
        maxPrice: 200,
        page: 1,
        limit: 10,
        sortBy: SortBy.PRICE,
        sortOrder: SortOrder.ASC,
      };

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: '1', number: '101', type: 'single', pricePerNight: 150 },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.search(searchDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('room');
    });

    it('should return cached results if available', async () => {
      const searchDto = {
        page: 1,
        limit: 10,
      };

      const cachedResult = {
        data: [{ id: '1', number: '101' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.search(searchDto);

      expect(result).toEqual(cachedResult);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return room from cache if available', async () => {
      const mockRoom = {
        id: '1',
        number: '101',
        type: 'single',
        pricePerNight: 150,
      };

      mockCacheManager.get.mockResolvedValue(mockRoom);

      const result = await service.findOne('1');

      expect(result).toEqual(mockRoom);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const mockRoom = {
        id: '1',
        number: '101',
        type: 'single',
        pricePerNight: 150,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.findOne('1');

      expect(result).toEqual(mockRoom);
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update room and invalidate cache', async () => {
      const mockRoom = {
        id: '1',
        number: '101',
        type: 'single',
        pricePerNight: 150,
      };
      const updateDto = { pricePerNight: 200 };

      mockCacheManager.get.mockResolvedValue(mockRoom);
      mockRepository.findOne.mockResolvedValue(mockRoom);
      mockRepository.save.mockResolvedValue({ ...mockRoom, ...updateDto });

      const result = await service.update('1', updateDto);

      expect(result.pricePerNight).toBe(200);
      expect(mockCacheManager.del).toHaveBeenCalledWith('room:1');
    });
  });

  describe('remove', () => {
    it('should remove room and invalidate cache', async () => {
      const mockRoom = {
        id: '1',
        number: '101',
        type: 'single',
        pricePerNight: 150,
      };

      mockCacheManager.get.mockResolvedValue(mockRoom);
      mockRepository.findOne.mockResolvedValue(mockRoom);
      mockRepository.remove.mockResolvedValue(mockRoom);

      await service.remove('1');

      expect(mockRepository.remove).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith('room:1');
    });
  });

  describe('checkAvailability', () => {
    it('should return available rooms from cache if available', async () => {
      const checkDto = {
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
      };
      const mockRooms = [
        { id: '1', number: '101', type: 'single', pricePerNight: 150 },
      ];

      mockCacheManager.get.mockResolvedValue(mockRooms);

      const result = await service.checkAvailability(checkDto);

      expect(result).toEqual(mockRooms);
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const checkDto = {
        checkIn: '2024-06-01',
        checkOut: '2024-06-05',
      };
      const mockRooms = [
        { id: '1', number: '101', type: 'single', pricePerNight: 150 },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRooms),
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.checkAvailability(checkDto);

      expect(result).toEqual(mockRooms);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getAvailabilityCalendar', () => {
    it('should return availability calendar', async () => {
      const availabilityDto = {
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      };

      const mockRooms = [
        { id: '1', number: '101', hotelId: 'hotel1' },
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRooms),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.manager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      mockRoomBlockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAvailabilityCalendar(availabilityDto);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
