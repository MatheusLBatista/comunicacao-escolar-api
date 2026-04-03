import { z } from 'zod';

export const MessageQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive({ message: 'A página deve ser um número positivo' })
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .positive({ message: 'O limite deve ser um número positivo' })
    .max(100, { message: 'O limite máximo permitido é 100' })
    .optional(),
});
