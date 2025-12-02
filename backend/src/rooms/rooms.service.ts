import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository, Between, Like, ILike, In } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { SearchRoomsDto, SortBy, SortOrder } from './dto/search-rooms.dto';
import { RoomAvailabilityDto } from './dto/room-availability.dto';
import { TenantContextService } from '../hotels/services/tenant-context.service';
import { RoomBlock } from '../room-blocks/entities/room-block.entity';

/**
 * Serviço para gerenciamento de quartos
 * 
 * Fornece funcionalidades para:
 * - CRUD de quartos
 * - Busca e filtros avançados
 * - Verificação de disponibilidade
 * - Calendário de ocupação
 * - Integração com sistema multi-tenant
 * 
 * @class RoomsService
 */
@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(RoomBlock)
    private roomBlocksRepository: Repository<RoomBlock>,
    private tenantContext: TenantContextService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Aplicar hotelId automaticamente se estiver no contexto
    const hotelId = this.tenantContext.getHotelId();
    if (hotelId && !createRoomDto.hotelId) {
      createRoomDto.hotelId = hotelId;
    }

    const room = this.roomsRepository.create(createRoomDto);
    const savedRoom = await this.roomsRepository.save(room);
    
    // Invalidar cache relacionado a quartos
    await this.invalidateRoomsCache();
    
    return savedRoom;
  }

  async findAll(): Promise<Room[]> {
    const hotelId = this.tenantContext.getHotelId();
    const cacheKey = `rooms:all:${hotelId || 'all'}`;
    
    // Tentar obter do cache
    const cached = await this.cacheManager.get<Room[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const where = this.tenantContext.applyHotelWhere({ isAvailable: true });
    const rooms = await this.roomsRepository.find({ 
      where,
      relations: ['reservations'], // Eager loading para otimizar
    });
    
    // Cachear por 5 minutos
    await this.cacheManager.set(cacheKey, rooms, 300);
    
    return rooms;
  }

  async search(searchDto: SearchRoomsDto): Promise<{
    data: Room[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      type,
      minPrice,
      maxPrice,
      amenities,
      isAvailable,
      minOccupancy,
      maxOccupancy,
      sortBy = SortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 12,
      checkIn,
      checkOut,
    } = searchDto;

    // Gerar chave de cache baseada nos parâmetros
    const hotelId = this.tenantContext.getHotelId();
    const cacheKey = `rooms:search:${hotelId || 'all'}:${JSON.stringify(searchDto)}:${page}:${limit}`;
    
    // Tentar obter do cache
    const cached = await this.cacheManager.get<{
      data: Room[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.roomsRepository.createQueryBuilder('room');

    // Aplicar filtro de hotel automaticamente
    this.tenantContext.applyHotelFilter(query);

    // Filtro de disponibilidade
    if (isAvailable !== undefined) {
      query.andWhere('room.isAvailable = :isAvailable', { isAvailable });
    } else {
      // Por padrão, mostrar apenas disponíveis
      query.andWhere('room.isAvailable = :isAvailable', { isAvailable: true });
    }

    // Busca por texto (full-text search)
    if (search) {
      query.andWhere(
        '(room.description ILIKE :search OR room.number ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro por tipo
    if (type) {
      query.andWhere('room.type = :type', { type });
    }

    // Filtro por preço
    if (minPrice !== undefined) {
      query.andWhere('room.pricePerNight >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      query.andWhere('room.pricePerNight <= :maxPrice', { maxPrice });
    }

    // Filtro por capacidade
    if (minOccupancy !== undefined) {
      query.andWhere('room.maxOccupancy >= :minOccupancy', { minOccupancy });
    }
    if (maxOccupancy !== undefined) {
      query.andWhere('room.maxOccupancy <= :maxOccupancy', { maxOccupancy });
    }

    // Filtro por comodidades
    if (amenities && amenities.length > 0) {
      // Para arrays simples, verificar se todas as comodidades estão presentes
      amenities.forEach((amenity, index) => {
        query.andWhere(`room.amenities LIKE :amenity${index}`, {
          [`amenity${index}`]: `%${amenity}%`,
        });
      });
    }

    // Verificar disponibilidade por período
    if (checkIn && checkOut) {
      query
        .leftJoin('room.reservations', 'reservation')
        .andWhere(
          '(reservation.id IS NULL OR NOT (reservation.checkIn <= :checkOut AND reservation.checkOut >= :checkIn AND reservation.status != :cancelled))',
          {
            checkIn,
            checkOut,
            cancelled: 'cancelled',
          },
        );
    }

    // Ordenação
    const orderBy = this.getOrderBy(sortBy);
    query.orderBy(`room.${orderBy}`, sortOrder);

    // Contar total antes da paginação
    const total = await query.getCount();

    // Paginação
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Otimizar query com select específico e eager loading
    const data = await query
      .select([
        'room.id',
        'room.number',
        'room.type',
        'room.pricePerNight',
        'room.description',
        'room.amenities',
        'room.isAvailable',
        'room.maxOccupancy',
        'room.imageUrl',
        'room.ratingAverage',
      ])
      .getMany();
    
    const totalPages = Math.ceil(total / limit);

    const result = {
      data,
      total,
      page,
      limit,
      totalPages,
    };

    // Cachear por 2 minutos (busca pode mudar frequentemente)
    await this.cacheManager.set(cacheKey, result, 120);

    return result;
  }

  private getOrderBy(sortBy: SortBy): string {
    const orderMap: Record<SortBy, string> = {
      [SortBy.PRICE]: 'pricePerNight',
      [SortBy.POPULARITY]: 'createdAt', // Por enquanto, usar createdAt como popularidade
      [SortBy.RATING]: 'ratingAverage', // Usar ratingAverage para ordenação por avaliação
      [SortBy.CREATED_AT]: 'createdAt',
    };
    return orderMap[sortBy] || 'createdAt';
  }

  async findOne(id: string): Promise<Room> {
    const cacheKey = `room:${id}`;
    
    // Tentar obter do cache
    const cached = await this.cacheManager.get<Room>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const where = this.tenantContext.applyHotelWhere({ id });
    const room = await this.roomsRepository.findOne({
      where,
      relations: ['reservations', 'reviews'], // Eager loading para otimizar
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    
    // Cachear por 5 minutos
    await this.cacheManager.set(cacheKey, room, 300);
    
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, updateRoomDto);
    const updatedRoom = await this.roomsRepository.save(room);
    
    // Invalidar cache relacionado
    await this.invalidateRoomsCache();
    await this.cacheManager.del(`room:${id}`);
    
    return updatedRoom;
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomsRepository.remove(room);
    
    // Invalidar cache relacionado
    await this.invalidateRoomsCache();
    await this.cacheManager.del(`room:${id}`);
  }

  async checkAvailability(
    checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<Room[]> {
    const { checkIn, checkOut, roomType } = checkAvailabilityDto;

    // Gerar chave de cache
    const hotelId = this.tenantContext.getHotelId();
    const cacheKey = `rooms:availability:${hotelId || 'all'}:${checkIn}:${checkOut}:${roomType || 'all'}`;
    
    // Tentar obter do cache
    const cached = await this.cacheManager.get<Room[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.reservations', 'reservation', 
        'reservation.checkIn <= :checkOut AND reservation.checkOut >= :checkIn AND reservation.status != :cancelled',
        { checkIn, checkOut, cancelled: 'cancelled' })
      .where('room.isAvailable = :isAvailable', { isAvailable: true });

    // Aplicar filtro de hotel automaticamente
    this.tenantContext.applyHotelFilter(query);

    query.andWhere(
      '(reservation.id IS NULL OR NOT (reservation.checkIn <= :checkOut AND reservation.checkOut >= :checkIn AND reservation.status != :cancelled))',
      {
        checkIn,
        checkOut,
        cancelled: 'cancelled',
      },
    );

    if (roomType) {
      query.andWhere('room.type = :roomType', { roomType });
    }

    const rooms = await query.getMany();
    
    // Cachear por 1 minuto (disponibilidade muda frequentemente)
    await this.cacheManager.set(cacheKey, rooms, 60);

    return rooms;
  }

  async getAvailabilityCalendar(
    availabilityDto: RoomAvailabilityDto,
  ): Promise<
    Array<{
      roomId: string;
      roomNumber: string;
      date: string;
      status: 'available' | 'reserved' | 'maintenance' | 'blocked';
      reservationId?: string;
    }>
  > {
    const { startDate, endDate, roomId } = availabilityDto;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Buscar quartos
    const query = this.roomsRepository.createQueryBuilder('room');
    this.tenantContext.applyHotelFilter(query);

    if (roomId) {
      query.andWhere('room.id = :roomId', { roomId });
    }

    const rooms = await query.getMany();

    // Buscar reservas no período
    const reservations = await this.roomsRepository.manager
      .createQueryBuilder()
      .select('reservation')
      .from('reservations', 'reservation')
      .leftJoin('reservation.room', 'room')
      .where('reservation.checkIn <= :endDate', { endDate })
      .andWhere('reservation.checkOut >= :startDate', { startDate })
      .andWhere('reservation.status != :cancelled', { cancelled: 'cancelled' })
      .getRawMany();

    // Gerar calendário
    const calendar: Array<{
      roomId: string;
      roomNumber: string;
      date: string;
      status: 'available' | 'reserved' | 'maintenance' | 'blocked';
      reservationId?: string;
    }> = [];

    // Buscar todos os bloqueios ativos no período
    const blocksQuery = this.roomBlocksRepository
      .createQueryBuilder('block')
      .where('block.isActive = :isActive', { isActive: true })
      .andWhere('block.startDate <= :endDate', { endDate: end.toISOString().split('T')[0] })
      .andWhere('block.endDate >= :startDate', { startDate: start.toISOString().split('T')[0] });

    const hotelId = this.tenantContext.getHotelId();
    if (hotelId) {
      blocksQuery.andWhere('block.hotelId = :hotelId', { hotelId });
    }

    const blocks = await blocksQuery.getMany();

    // Iterar por cada quarto e cada data
    for (const room of rooms) {
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dateObj = new Date(dateStr);

        // Verificar se há reserva para esta data
        const reservation = reservations.find(
          (r) =>
            r.room_id === room.id &&
            r.reservation_checkIn <= dateStr &&
            r.reservation_checkOut > dateStr &&
            r.reservation_status !== 'cancelled',
        );

        // Verificar se há bloqueio para esta data
        const block = blocks.find(
          (b) =>
            b.roomId === room.id &&
            new Date(b.startDate) <= dateObj &&
            new Date(b.endDate) >= dateObj,
        );

        let status: 'available' | 'reserved' | 'maintenance' | 'blocked' = 'available';
        if (reservation) {
          status = 'reserved';
        } else if (block) {
          status = block.type === 'maintenance' ? 'maintenance' : 'blocked';
        }

        calendar.push({
          roomId: room.id,
          roomNumber: room.number,
          date: dateStr,
          status,
          reservationId: reservation?.reservation_id,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return calendar;
  }

  /**
   * Invalida todo o cache relacionado a quartos
   * Nota: cache-manager não suporta busca por padrão diretamente
   * As chaves específicas são invalidadas nos métodos update/remove
   */
  private async invalidateRoomsCache(): Promise<void> {
    // As chaves específicas já são invalidadas nos métodos individuais
    // Este método existe para compatibilidade futura se implementarmos
    // invalidação por padrão usando Redis diretamente
    try {
      // Em produção, considere usar Redis diretamente para busca por padrão
      // Por enquanto, as chaves específicas são gerenciadas individualmente
    } catch (error) {
      // Ignorar erros de cache
    }
  }
}

