import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: Repository<Review>;
  let roomRepository: Repository<Room>;
  let reservationRepository: Repository<Reservation>;

  const mockReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockReservationRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    reservationRepository = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review and update room rating', async () => {
      const mockRoom = { id: 'room1', ratingAverage: 0 };
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user1',
        rating: 5,
        comment: 'Great room!',
      };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReservationRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockReviewRepository.find.mockResolvedValue([mockReview]);
      mockRoomRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.create(mockReview as any, 'user1');

      expect(result).toEqual(mockReview);
      expect(mockRoomRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ roomId: 'invalid', rating: 5 } as any, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create review with valid rating', async () => {
      const mockRoom = { id: 'room1' };
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user1',
        rating: 5,
      };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockReviewRepository.find.mockResolvedValue([mockReview]);
      mockRoomRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.create({ roomId: 'room1', rating: 5 } as any, 'user1');

      expect(result).toEqual(mockReview);
    });

    it('should throw BadRequestException if user already reviewed room', async () => {
      const mockRoom = { id: 'room1' };
      const existingReview = { id: 'review1', userId: 'user1', roomId: 'room1' };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockReviewRepository.findOne.mockResolvedValue(existingReview);

      await expect(
        service.create({ roomId: 'room1', rating: 5 } as any, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify reservation if reservationId is provided', async () => {
      const mockRoom = { id: 'room1' };
      const mockReservation = {
        id: 'res1',
        userId: 'user1',
        roomId: 'room1',
        status: 'completed',
      };
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user1',
        rating: 5,
        reservationId: 'res1',
        isVerified: true,
      };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReservationRepository.findOne.mockResolvedValue(mockReservation);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockReviewRepository.find.mockResolvedValue([mockReview]);
      mockRoomRepository.save.mockResolvedValue(mockRoom);

      const result = await service.create(
        { roomId: 'room1', reservationId: 'res1', rating: 5 } as any,
        'user1',
      );

      expect(result.isVerified).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all reviews for a room when roomId is provided', async () => {
      const mockReviews = [
        { id: 'review1', roomId: 'room1', rating: 5 },
        { id: 'review2', roomId: 'room1', rating: 4 },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReviews),
      };

      mockReviewRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('room1');

      expect(result).toEqual(mockReviews);
      expect(mockReviewRepository.createQueryBuilder).toHaveBeenCalledWith('review');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('review.roomId = :roomId', {
        roomId: 'room1',
      });
    });

    it('should return all reviews when roomId is not provided', async () => {
      const mockReviews = [
        { id: 'review1', roomId: 'room1', rating: 5 },
        { id: 'review2', roomId: 'room2', rating: 4 },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReviews),
      };

      mockReviewRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(mockReviews);
      expect(mockReviewRepository.createQueryBuilder).toHaveBeenCalledWith('review');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update review and recalculate rating', async () => {
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user1',
        rating: 4,
        comment: 'Updated comment',
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.save.mockResolvedValue({ ...mockReview, rating: 5 });
      mockReviewRepository.find.mockResolvedValue([{ ...mockReview, rating: 5 }]);
      mockRoomRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('review1', { rating: 5 }, 'user1');

      expect(result.rating).toBe(5);
      expect(mockRoomRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid', { rating: 5 }, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own review', async () => {
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user2',
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(
        service.update('review1', { rating: 5 }, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove review and recalculate rating', async () => {
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user1',
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.remove.mockResolvedValue(mockReview);
      mockReviewRepository.find.mockResolvedValue([]);
      mockRoomRepository.update.mockResolvedValue({ affected: 1 });

      await service.remove('review1', 'user1');

      expect(mockReviewRepository.remove).toHaveBeenCalledWith(mockReview);
      expect(mockRoomRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own review', async () => {
      const mockReview = {
        id: 'review1',
        roomId: 'room1',
        userId: 'user2',
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(service.remove('review1', 'user1')).rejects.toThrow(ForbiddenException);
    });
  });
});
