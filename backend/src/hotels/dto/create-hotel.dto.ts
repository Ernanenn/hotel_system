import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUrl,
} from 'class-validator';

export class CreateHotelDto {
  @ApiProperty({ description: 'Nome do hotel' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Subdomínio único (ex: hotel1)', required: false })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiProperty({ description: 'Endereço completo' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Estado' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'CEP' })
  @IsString()
  zipCode: string;

  @ApiProperty({ description: 'País' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Telefone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Website', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ description: 'Descrição', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Hotel ativo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

