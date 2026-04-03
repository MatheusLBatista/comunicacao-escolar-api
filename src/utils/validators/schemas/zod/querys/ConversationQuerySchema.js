import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdRefinement = (id) => mongoose.Types.ObjectId.isValid(id);

export const ConversationIdSchema = z
  .string()
  .refine(objectIdRefinement, { message: 'ID inválido' });

export const ConversationQuerySchema = z.object({
  type: z.enum(['private', 'daily_log_reply']).optional(),

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
