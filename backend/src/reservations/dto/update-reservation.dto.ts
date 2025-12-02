import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationDto {
  @ApiProperty({ enum: ReservationStatus, required: false })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  guestNotes?: string;
}

