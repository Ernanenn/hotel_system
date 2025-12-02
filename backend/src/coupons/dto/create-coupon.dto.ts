import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { CouponType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ description: 'Código único do cupom' })
  @IsString()
  code: string;

  @ApiProperty({ enum: CouponType, description: 'Tipo de desconto' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Valor do desconto (percentual 0-100 ou valor fixo)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Data de início da validade' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Data de fim da validade' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ required: false, description: 'Número máximo de usos (0 = ilimitado)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUses?: number;

  @ApiProperty({ required: false, default: true, description: 'Cupom ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Valor mínimo de compra para usar o cupom' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiProperty({ required: false, description: 'Descrição do cupom' })
  @IsOptional()
  @IsString()
  description?: string;
}

