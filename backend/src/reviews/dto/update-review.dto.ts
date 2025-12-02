import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Excelente quarto, muito confortável!', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

