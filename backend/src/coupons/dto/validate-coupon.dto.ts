import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ description: 'Código do cupom' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Valor total da compra' })
  @IsNumber()
  @Min(0)
  totalAmount: number;
}

