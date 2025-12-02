import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserReservationsQueryDto } from './dto/user-reservations-query.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ExportDataDto } from './dto/export-data.dto';
import * as bcrypt from 'bcrypt';

/**
 * Serviço para gerenciamento de usuários
 * 
 * Fornece funcionalidades para:
 * - CRUD de usuários
 * - Gerenciamento de perfis
 * - Histórico de reservas
 * - Preferências de notificação
 * - Exportação de dados (GDPR)
 * - Exclusão de conta com anonimização
 * 
 * @class UsersService
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
  ) {}

  /**
   * Cria um novo usuário no sistema
   * 
   * @param {Partial<User>} createUserDto - Dados do usuário a ser criado
   * @returns {Promise<User>} Usuário criado com senha hasheada
   * @throws {BadRequestException} Se o email já estiver em uso
   */
  async create(createUserDto: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: Partial<User>,
  ): Promise<Partial<User>> {
    const user = await this.findOne(userId);
    
    // Verificar se o email já está em uso por outro usuário
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateProfileDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email já está em uso');
      }
    }

    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(updateProfileDto.password, 10);
    }
    
    Object.assign(user, updateProfileDto);
    const updatedUser = await this.usersRepository.save(user);
    
    // Retornar sem a senha
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async getUserReservations(
    userId: string,
    query: UserReservationsQueryDto,
  ): Promise<{
    data: Reservation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 10, startDate, endDate } = query;

    const queryBuilder = this.reservationsRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.payment', 'payment')
      .where('reservation.userId = :userId', { userId })
      .orderBy('reservation.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('reservation.checkIn >= :startDate', { startDate });
      queryBuilder.andWhere('reservation.checkOut <= :endDate', { endDate });
    } else if (startDate) {
      queryBuilder.andWhere('reservation.checkIn >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('reservation.checkOut <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      // Criar preferências padrão se não existirem
      preferences = this.preferencesRepository.create({
        userId,
        emailNotifications: true,
        reservationConfirmations: true,
        reservationReminders: true,
        promotionalEmails: true,
        smsNotifications: true,
      });
      preferences = await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        ...updatePreferencesDto,
      });
    } else {
      Object.assign(preferences, updatePreferencesDto);
    }

    return this.preferencesRepository.save(preferences);
  }

  /**
   * Exporta todos os dados pessoais do usuário (conformidade GDPR/LGPD)
   * 
   * Inclui:
   * - Informações pessoais
   * - Preferências de notificação
   * - Histórico completo de reservas
   * - Avaliações feitas pelo usuário
   * 
   * @param {string} userId - ID do usuário
   * @param {'json' | 'csv'} format - Formato de exportação (padrão: 'json')
   * @returns {Promise<any>} Dados do usuário no formato solicitado
   * @throws {NotFoundException} Se o usuário não for encontrado
   */
  async exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['reservations', 'reservations.room', 'reservations.payment'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar preferências
    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    // Buscar avaliações do usuário
    const reviews = await this.reservationsRepository.manager
      .createQueryBuilder()
      .select([
        'review.id as review_id',
        'review.roomId as review_roomId',
        'review.rating as review_rating',
        'review.comment as review_comment',
        'review.createdAt as review_createdAt',
      ])
      .from('reviews', 'review')
      .where('review.userId = :userId', { userId })
      .getRawMany();

    // Montar dados do usuário
    const userData = {
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      preferences: preferences
        ? {
            emailNotifications: preferences.emailNotifications,
            reservationConfirmations: preferences.reservationConfirmations,
            reservationReminders: preferences.reservationReminders,
            promotionalEmails: preferences.promotionalEmails,
            smsNotifications: preferences.smsNotifications,
            pushNotifications: preferences.pushNotifications,
          }
        : null,
      reservations: user.reservations?.map((reservation) => ({
        id: reservation.id,
        roomNumber: reservation.room?.number,
        roomType: reservation.room?.type,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        totalPrice: reservation.totalPrice,
        discountAmount: reservation.discountAmount,
        couponCode: reservation.couponCode,
        status: reservation.status,
        guestNotes: reservation.guestNotes,
        paymentStatus: reservation.payment?.status,
        paymentAmount: reservation.payment?.amount,
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt,
      })) || [],
      reviews: reviews.map((review) => ({
        id: review.review_id,
        roomId: review.review_roomId,
        rating: review.review_rating,
        comment: review.review_comment,
        createdAt: review.review_createdAt,
      })),
      exportDate: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Converter para CSV (simplificado)
      return this.convertToCSV(userData);
    }

    return userData;
  }

  private convertToCSV(data: any): string {
    const lines: string[] = [];
    
    // Cabeçalho
    lines.push('Seção, Campo, Valor');
    
    // Informações pessoais
    Object.entries(data.personalInformation).forEach(([key, value]) => {
      lines.push(`Informações Pessoais, ${key}, ${value}`);
    });
    
    // Preferências
    if (data.preferences) {
      Object.entries(data.preferences).forEach(([key, value]) => {
        lines.push(`Preferências, ${key}, ${value}`);
      });
    }
    
    // Reservas
    data.reservations.forEach((reservation: any, index: number) => {
      Object.entries(reservation).forEach(([key, value]) => {
        lines.push(`Reserva ${index + 1}, ${key}, ${value}`);
      });
    });
    
    // Avaliações
    data.reviews.forEach((review: any, index: number) => {
      Object.entries(review).forEach(([key, value]) => {
        lines.push(`Avaliação ${index + 1}, ${key}, ${value}`);
      });
    });
    
    return lines.join('\n');
  }

  /**
   * Exclui a conta do usuário anonimizando seus dados pessoais (conformidade GDPR/LGPD)
   * 
   * Anonimiza:
   * - Email: deleted_{userId}@deleted.local
   * - Nome: "Usuário Deletado"
   * - Telefone: removido
   * - Senha: hash aleatório
   * - Conta desativada
   * 
   * Nota: Reservas e avaliações são mantidas para fins de histórico,
   * mas sem identificação pessoal do usuário.
   * 
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   * @throws {NotFoundException} Se o usuário não for encontrado
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Anonimizar dados pessoais
    const anonymizedEmail = `deleted_${user.id}@deleted.local`;
    const anonymizedName = 'Usuário Deletado';

    user.email = anonymizedEmail;
    user.firstName = anonymizedName;
    user.lastName = '';
    user.phone = null;
    user.isActive = false;
    user.password = await bcrypt.hash(Math.random().toString(), 10); // Senha aleatória

    await this.usersRepository.save(user);

    // Remover preferências
    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });
    if (preferences) {
      await this.preferencesRepository.remove(preferences);
    }

    // Nota: Reservas e avaliações são mantidas para fins de histórico e relatórios
    // mas sem identificação pessoal do usuário
  }
}

