import { z } from 'zod';
import { RoomType } from '../types';

export const roomSchema = z.object({
  number: z.string().min(1, 'Número do quarto é obrigatório'),
  type: z.nativeEnum(RoomType, {
    errorMap: () => ({ message: 'Tipo de quarto inválido' }),
  }),
  pricePerNight: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  description: z.string().optional(),
  maxOccupancy: z.number().min(1, 'Capacidade máxima deve ser pelo menos 1'),
  amenities: z.array(z.string()).optional(),
});

export type RoomFormData = z.infer<typeof roomSchema>;

