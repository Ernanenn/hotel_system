import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateQrCodeDto {
  @ApiProperty({ description: 'Token do QR code' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

