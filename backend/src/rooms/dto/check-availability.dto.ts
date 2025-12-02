import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class CheckAvailabilityDto {
  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2024-06-05' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ enum: RoomType, required: false })
  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;
}

