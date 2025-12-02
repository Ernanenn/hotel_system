import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { BlockType } from '../entities/room-block.entity';

export class CreateRoomBlockDto {
  @ApiProperty({ description: 'ID do quarto' })
  @IsString()
  roomId: string;

  @ApiProperty({ description: 'Data de início do bloqueio', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de fim do bloqueio', example: '2024-01-05' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: BlockType, description: 'Tipo de bloqueio', default: BlockType.MAINTENANCE })
  @IsEnum(BlockType)
  type: BlockType;

  @ApiProperty({ description: 'Motivo do bloqueio', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Bloqueio ativo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

