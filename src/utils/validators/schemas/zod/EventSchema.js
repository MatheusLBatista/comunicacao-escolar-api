import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const TargetSchema = z.object({
  scope: z.enum(['all', 'class']).default('all'),
});

export const EventSchema = z.object({
  id: z.string().regex(objectIdRegex, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  school_id: z.string().regex(objectIdRegex, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  title: z.string({ message: 'O título não é uma string válida.' }).min(1),
  description: z.string().optional().default(''),
  type: z.enum(['event', 'meeting', 'commemorative', 'pedagogical']),
  start_date: z.coerce.date({ message: 'A data inicial é inválida.' }),
  end_date: z.coerce
    .date({ message: 'A data final é inválida.' })
    .nullable()
    .optional(),
  all_day: z.boolean().optional().default(false),
  target: TargetSchema.optional().default({ scope: 'all' }),
  created_by: z.string().regex(objectIdRegex, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  active: z.boolean().optional().default(true),
});

export const EventSchemaInput = EventSchema.omit({
  id: true,
  created_by: true,
});
