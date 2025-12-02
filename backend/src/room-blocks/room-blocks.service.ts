import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RoomBlock, BlockType } from './entities/room-block.entity';
import { CreateRoomBlockDto } from './dto/create-room-block.dto';
import { UpdateRoomBlockDto } from './dto/update-room-block.dto';
import { RoomsService } from '../rooms/rooms.service';
import { TenantContextService } from '../hotels/services/tenant-context.service';
import { normalizeDate } from '../common/utils';

@Injectable()
export class RoomBlocksService {
  constructor(
    @InjectRepository(RoomBlock)
    private roomBlocksRepository: Repository<RoomBlock>,
    private roomsService: RoomsService,
    private tenantContext: TenantContextService,
  ) {}

  async create(createRoomBlockDto: CreateRoomBlockDto): Promise<RoomBlock> {
    const { roomId, startDate, endDate } = createRoomBlockDto;

    // Verificar se o quarto existe
    const room = await this.roomsService.findOne(roomId);

    // Normalizar datas
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    // Validar datas
    if (start >= end) {
      throw new BadRequestException('Data de início deve ser anterior à data de fim');
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new BadRequestException('Data de início não pode ser no passado');
    }

    // Verificar conflitos com reservas existentes
    const conflictingReservations = await this.roomBlocksRepository.manager
      .createQueryBuilder()
      .select('reservation')
      .from('reservations', 'reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.checkIn < :endDate', { endDate: end.toISOString().split('T')[0] })
      .andWhere('reservation.checkOut > :startDate', { startDate: start.toISOString().split('T')[0] })
      .andWhere('reservation.status != :cancelled', { cancelled: 'cancelled' })
      .getCount();

    if (conflictingReservations > 0) {
      throw new BadRequestException(
        'Não é possível bloquear o quarto pois há reservas confirmadas neste período',
      );
    }

    // Verificar conflitos com outros bloqueios ativos
    const conflictingBlocks = await this.roomBlocksRepository.count({
      where: {
        roomId,
        isActive: true,
        startDate: Between(start, end),
      },
    });

    if (conflictingBlocks > 0) {
      throw new BadRequestException('Já existe um bloqueio ativo neste período');
    }

    // Obter hotelId do contexto ou do quarto
    const hotelId = this.tenantContext.getHotelId() || room.hotelId;

    const block = this.roomBlocksRepository.create({
      ...createRoomBlockDto,
      hotelId,
      startDate: start,
      endDate: end,
    });

    return this.roomBlocksRepository.save(block);
  }

  async findAll(roomId?: string): Promise<RoomBlock[]> {
    const query = this.roomBlocksRepository.createQueryBuilder('block');
    this.tenantContext.applyHotelFilter(query, 'hotelId');

    if (roomId) {
      query.andWhere('block.roomId = :roomId', { roomId });
    }

    return query
      .leftJoinAndSelect('block.room', 'room')
      .orderBy('block.startDate', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<RoomBlock> {
    const where = this.tenantContext.applyHotelWhere({ id }, 'hotelId');
    const block = await this.roomBlocksRepository.findOne({
      where,
      relations: ['room'],
    });

    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return block;
  }

  async update(id: string, updateRoomBlockDto: UpdateRoomBlockDto): Promise<RoomBlock> {
    const block = await this.findOne(id);

    // Se estiver atualizando datas, validar novamente
    if (updateRoomBlockDto.startDate || updateRoomBlockDto.endDate) {
      const startDate = updateRoomBlockDto.startDate
        ? normalizeDate(updateRoomBlockDto.startDate)
        : block.startDate;
      const endDate = updateRoomBlockDto.endDate
        ? normalizeDate(updateRoomBlockDto.endDate)
        : block.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Data de início deve ser anterior à data de fim');
      }

      // Verificar conflitos (excluindo o próprio bloqueio)
      const conflictingReservations = await this.roomBlocksRepository.manager
        .createQueryBuilder()
        .select('reservation')
        .from('reservations', 'reservation')
        .where('reservation.roomId = :roomId', { roomId: block.roomId })
        .andWhere('reservation.checkIn < :endDate', { endDate: endDate.toISOString().split('T')[0] })
        .andWhere('reservation.checkOut > :startDate', { startDate: startDate.toISOString().split('T')[0] })
        .andWhere('reservation.status != :cancelled', { cancelled: 'cancelled' })
        .getCount();

      if (conflictingReservations > 0) {
        throw new BadRequestException(
          'Não é possível bloquear o quarto pois há reservas confirmadas neste período',
        );
      }

      const conflictingBlocks = await this.roomBlocksRepository.count({
        where: {
          roomId: block.roomId,
          isActive: true,
          startDate: Between(startDate, endDate),
        },
      });

      if (conflictingBlocks > 1) {
        throw new BadRequestException('Já existe outro bloqueio ativo neste período');
      }

      updateRoomBlockDto.startDate = startDate as any;
      updateRoomBlockDto.endDate = endDate as any;
    }

    Object.assign(block, updateRoomBlockDto);
    return this.roomBlocksRepository.save(block);
  }

  async remove(id: string): Promise<void> {
    const block = await this.findOne(id);
    await this.roomBlocksRepository.remove(block);
  }
}

