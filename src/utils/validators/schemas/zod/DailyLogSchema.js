import { z } from 'zod';
import ObjectIdSchema from './ObjectIdSchema.js';

const EntrySchema = z.object({
  field_key: z
    .string()
    .min(1, 'Campo field_key é obrigatório e não pode ser vazio.'),
  value: z.string().min(0),
});

const DailyLogSchema = z.object({
  school_id: ObjectIdSchema,
  student_id: ObjectIdSchema,
  teacher_id: ObjectIdSchema,
  dailylogtemplate_id: ObjectIdSchema,
  is_present: z.boolean(),
  entries: z.array(EntrySchema).optional().default([]),
  attachments: z.array(z.string()).optional().default([]),
  read_at: z
    .preprocess((val) => (val ? new Date(val) : null), z.date().nullable())
    .optional()
    .nullable(),
  date: z.preprocess((val) => new Date(val), z.date()),
  observation: z.string().optional().default(''),
  ativo: z.boolean().optional().default(true),
});

const DailyLogUpdateSchema = DailyLogSchema.partial();

export { DailyLogSchema, DailyLogUpdateSchema };
