import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, {
  message: 'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
});

const Target = z.object({
  scope: z.enum(['all', 'class']).default('all'),
  target_ids: z.array(objectIdSchema).optional(),
});

export const PostSchema = z.object({
  id: objectIdSchema,
  school_id: objectIdSchema,
  author_id: objectIdSchema,
  title: z.string({ message: 'O título não é uma string válida.' }),
  content: z.string({ message: 'O conteúdo não é uma string válida.' }),
  target: Target.optional(),
  attachments: z
    .string({ message: 'O attachments não é uma string válida.' })
    .url({ message: 'A url passada não é uma url válida.' })
    .array()
    .optional(),
  active: z.coerce.boolean().default(true),
  wait_attachments: z.coerce.boolean().default(false).optional(),
});

export const PostSchemaInput = PostSchema.omit({ id: true }).partial({
  school_id: true,
  author_id: true,
});
export const PostSchemaUpdate = PostSchema.pick({
  title: true,
  content: true,
  target: true,
  active: true,
}).partial();
