import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class OccupancyReportDto {
  @ApiProperty({ required: false, description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'ID do quarto específico' })
  @IsOptional()
  roomId?: string;
}

