import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum RevenueGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ROOM = 'room',
  TYPE = 'type',
}

export class RevenueReportDto {
  @ApiProperty({ required: false, description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: RevenueGroupBy, required: false, default: RevenueGroupBy.DAY })
  @IsOptional()
  @IsEnum(RevenueGroupBy)
  groupBy?: RevenueGroupBy;

  @ApiProperty({ required: false, description: 'ID do quarto específico' })
  @IsOptional()
  roomId?: string;
}

