import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: 'room-uuid-here' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2024-06-05' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 'Special requests', required: false })
  @IsOptional()
  @IsString()
  guestNotes?: string;

  @ApiProperty({ example: 'PROMO10', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

