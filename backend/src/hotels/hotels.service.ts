import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private hotelsRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    // Verificar se o subdomínio já existe (se fornecido)
    if (createHotelDto.subdomain) {
      const existingHotel = await this.hotelsRepository.findOne({
        where: { subdomain: createHotelDto.subdomain },
      });

      if (existingHotel) {
        throw new BadRequestException('Subdomínio já está em uso');
      }
    }

    // Verificar se o nome já existe
    const existingName = await this.hotelsRepository.findOne({
      where: { name: createHotelDto.name },
    });

    if (existingName) {
      throw new BadRequestException('Nome do hotel já está em uso');
    }

    const hotel = this.hotelsRepository.create(createHotelDto);
    return this.hotelsRepository.save(hotel);
  }

  async findAll(): Promise<Hotel[]> {
    return this.hotelsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelsRepository.findOne({
      where: { id },
      relations: ['rooms', 'reservations'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel não encontrado');
    }

    return hotel;
  }

  async findBySubdomain(subdomain: string): Promise<Hotel> {
    const hotel = await this.hotelsRepository.findOne({
      where: { subdomain, isActive: true },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel não encontrado ou inativo');
    }

    return hotel;
  }

  async update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(id);

    // Verificar se o subdomínio já existe (se estiver sendo alterado)
    if (updateHotelDto.subdomain && updateHotelDto.subdomain !== hotel.subdomain) {
      const existingHotel = await this.hotelsRepository.findOne({
        where: { subdomain: updateHotelDto.subdomain },
      });

      if (existingHotel) {
        throw new BadRequestException('Subdomínio já está em uso');
      }
    }

    // Verificar se o nome já existe (se estiver sendo alterado)
    if (updateHotelDto.name && updateHotelDto.name !== hotel.name) {
      const existingName = await this.hotelsRepository.findOne({
        where: { name: updateHotelDto.name },
      });

      if (existingName) {
        throw new BadRequestException('Nome do hotel já está em uso');
      }
    }

    Object.assign(hotel, updateHotelDto);
    return this.hotelsRepository.save(hotel);
  }

  async remove(id: string): Promise<void> {
    const hotel = await this.findOne(id);
    await this.hotelsRepository.remove(hotel);
  }
}

