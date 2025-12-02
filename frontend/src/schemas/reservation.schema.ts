import { z } from 'zod';

export const reservationSchema = z.object({
  checkIn: z.string().min(1, 'Data de check-in é obrigatória'),
  checkOut: z.string().min(1, 'Data de check-out é obrigatória'),
  guestNotes: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: 'Data de check-out deve ser posterior à data de check-in',
  path: ['checkOut'],
});

export type ReservationFormData = z.infer<typeof reservationSchema>;

