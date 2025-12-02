import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional } from 'class-validator';

export class RoomAvailabilityDto {
  @ApiProperty({ description: 'Data de início do período', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim do período', example: '2024-01-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'ID do quarto (opcional)', required: false })
  @IsOptional()
  @IsString()
  roomId?: string;
}

