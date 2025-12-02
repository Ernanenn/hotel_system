import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'room-id-here' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'reservation-id-here', required: false })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Excelente quarto, muito confortável!', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

