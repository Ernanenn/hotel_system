import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  phone: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

