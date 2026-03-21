import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdRefinement = (id) => mongoose.Types.ObjectId.isValid(id);

export const DailyLogTemplateIdSchema = z
  .string()
  .refine(objectIdRefinement, { message: 'ID inválido' });

export const DailyLogTemplateQuerySchema = z.object({
  school_id: z
    .string()
    .refine(objectIdRefinement, { message: 'school_id inválido' })
    .optional(),

  student_id: z
    .string()
    .refine(objectIdRefinement, { message: 'student_id inválido' })
    .optional(),

  ativo: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),

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
