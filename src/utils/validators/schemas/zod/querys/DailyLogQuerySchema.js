import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdRefinement = (id) => mongoose.Types.ObjectId.isValid(id);

export const DailyLogIdSchema = z
  .string()
  .refine(objectIdRefinement, { message: 'ID inválido' });

export const DailyLogQuerySchema = z.object({
  school_id: z
    .string()
    .refine(objectIdRefinement, { message: 'school_id inválido' })
    .optional(),

  student_id: z
    .string()
    .refine(objectIdRefinement, { message: 'student_id inválido' })
    .optional(),

  teacher_id: z
    .string()
    .refine(objectIdRefinement, { message: 'teacher_id inválido' })
    .optional(),

  dailylogtemplate_id: z
    .string()
    .refine(objectIdRefinement, { message: 'dailylogtemplate_id inválido' })
    .optional(),

  is_present: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),

  read: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),

  ativo: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),

  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),

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
