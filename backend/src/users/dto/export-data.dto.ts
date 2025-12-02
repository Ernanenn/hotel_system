import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExportDataDto {
  @ApiProperty({ description: 'Formato de exportação', required: false, enum: ['json', 'csv'] })
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';
}

