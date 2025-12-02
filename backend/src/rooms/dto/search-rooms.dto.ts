import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '../entities/room.entity';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SortBy {
  PRICE = 'price',
  POPULARITY = 'popularity',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
}

export class SearchRoomsDto {
  @ApiProperty({ required: false, description: 'Busca por texto (nome, descrição)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: RoomType, required: false, description: 'Filtrar por tipo de quarto' })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiProperty({ required: false, description: 'Preço mínimo por noite' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, description: 'Preço máximo por noite' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Comodidades (array de strings)',
    example: ['WiFi', 'TV'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ required: false, description: 'Filtrar apenas quartos disponíveis' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false, description: 'Capacidade mínima' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minOccupancy?: number;

  @ApiProperty({ required: false, description: 'Capacidade máxima' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxOccupancy?: number;

  @ApiProperty({ enum: SortBy, required: false, default: SortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiProperty({ enum: SortOrder, required: false, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiProperty({ required: false, description: 'Página (começa em 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, description: 'Itens por página', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, description: 'Data de check-in para verificar disponibilidade' })
  @IsOptional()
  @IsString()
  checkIn?: string;

  @ApiProperty({ required: false, description: 'Data de check-out para verificar disponibilidade' })
  @IsOptional()
  @IsString()
  checkOut?: string;
}

