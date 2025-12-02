import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  number: string;

  @ApiProperty({ enum: RoomType, example: RoomType.DOUBLE })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty({ example: 'Comfortable room with city view', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['WiFi', 'TV', 'Air Conditioning'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ example: 2, default: 1 })
  @IsOptional()
  @IsNumber()
  maxOccupancy?: number;

  @ApiProperty({ example: 'https://example.com/room.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID do hotel (opcional, pode ser preenchido automaticamente)', required: false })
  @IsOptional()
  @IsUUID()
  hotelId?: string;
}

