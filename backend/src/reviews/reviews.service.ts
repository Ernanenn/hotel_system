import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    const { roomId, reservationId, rating, comment } = createReviewDto;

    // Verificar se o quarto existe
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Quarto não encontrado');
    }

    // Verificar se o usuário já avaliou este quarto
    const existingReview = await this.reviewsRepository.findOne({
      where: { userId, roomId },
    });
    if (existingReview) {
      throw new BadRequestException('Você já avaliou este quarto');
    }

    // Se houver reservationId, verificar se a reserva pertence ao usuário e está confirmada
    let isVerified = false;
    if (reservationId) {
      const reservation = await this.reservationsRepository.findOne({
        where: { id: reservationId, userId },
      });
      if (!reservation) {
        throw new NotFoundException('Reserva não encontrada ou não pertence a você');
      }
      if (reservation.status !== 'confirmed' && reservation.status !== 'completed') {
        throw new BadRequestException('Apenas reservas confirmadas ou concluídas podem ser avaliadas');
      }
      if (reservation.roomId !== roomId) {
        throw new BadRequestException('A reserva não corresponde ao quarto selecionado');
      }
      isVerified = true;
    }

    const review = this.reviewsRepository.create({
      userId,
      roomId,
      reservationId,
      rating,
      comment,
      isVerified,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Atualizar a média de avaliações do quarto
    await this.updateRoomRating(roomId);

    return savedReview;
  }

  async findAll(roomId?: string): Promise<Review[]> {
    const query = this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.room', 'room')
      .orderBy('review.createdAt', 'DESC');

    if (roomId) {
      query.where('review.roomId = :roomId', { roomId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'room'],
    });
    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<Review> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta avaliação');
    }

    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewsRepository.save(review);

    // Atualizar a média de avaliações do quarto
    await this.updateRoomRating(review.roomId);

    return updatedReview;
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para deletar esta avaliação');
    }

    const roomId = review.roomId;
    await this.reviewsRepository.remove(review);

    // Atualizar a média de avaliações do quarto
    await this.updateRoomRating(roomId);
  }

  async getRoomReviews(roomId: string): Promise<{
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.reviewsRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
      totalReviews,
      ratingDistribution,
    };
  }

  private async updateRoomRating(roomId: string): Promise<void> {
    const reviews = await this.reviewsRepository.find({ where: { roomId } });
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    await this.roomsRepository.update(roomId, {
      ratingAverage: Math.round(averageRating * 10) / 10,
    });
  }
}

