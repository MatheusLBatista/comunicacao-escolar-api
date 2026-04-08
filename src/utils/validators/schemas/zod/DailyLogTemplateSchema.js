import { z } from 'zod';
import ObjectIdSchema from './ObjectIdSchema.js';

// Schema para cada campo configurável do template
const TemplateFieldSchema = z
  .object({
    key: z.string().min(1, 'Campo key é obrigatório.'),
    label: z.string().min(1, 'Campo label é obrigatório.'),
    type: z.enum(['select', 'text', 'boolean']),
    options: z.array(z.string()).optional().default([]),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'select') {
      if (!Array.isArray(val.options) || val.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Campo options é obrigatório para campos do tipo select e deve conter pelo menos 1 opção.',
          path: ['options'],
        });
      }
    }
  });

const DailyLogTemplateSchema = z.object({
  school_id: ObjectIdSchema,
  student_id: z.union([ObjectIdSchema, z.null()]).optional(),
  fields: z
    .array(TemplateFieldSchema)
    .min(1, 'O template precisa ter ao menos 1 campo.'),
  ativo: z.boolean().optional().default(true),
});

const DailyLogTemplateUpdateSchema = DailyLogTemplateSchema.partial();

export { DailyLogTemplateSchema, DailyLogTemplateUpdateSchema };

// Uso: em controllers, usar `DailyLogTemplateSchema.parse(req.body)` para criar
// e `DailyLogTemplateUpdateSchema.parse(req.body)` para updates parciais.
