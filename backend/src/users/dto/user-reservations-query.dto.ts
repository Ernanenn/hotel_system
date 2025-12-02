import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../../reservations/entities/reservation.entity';

export class UserReservationsQueryDto {
  @ApiProperty({ enum: ReservationStatus, required: false })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiProperty({ required: false, description: 'Página (começa em 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, description: 'Itens por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

