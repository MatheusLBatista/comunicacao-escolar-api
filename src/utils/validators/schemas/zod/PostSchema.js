import { z } from 'zod';

const Target = z.object({
  target_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, {
      message:
        'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
    }).default(null)
    .optional(),
  scope: z.enum(['all', 'class']).default('all'),
});

export const PostSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  school_id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  author_id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message:
      'ID inválido (deve ser um MongoDB ObjectId de 24 caracteres hexadecimais)',
  }),
  title: z.string({ message: 'O título não é uma string válida.' }),
  content: z.string({ message: 'O conteúdo não é uma string válida.' }),
  target: Target.optional(),
  attachments: z
    .string({ message: 'O attachments não é uma string válida.' })
    .url({ message: 'A url passada não é uma url válida.' })
    .array()
    .optional(),
  active: z.boolean().default(true),
});

export const PostSchemaInput = (PostSchema.omit({ id: true })).partial({school_id:true, author_id:true});
export const PostSchemaUpdate = PostSchema.pick({title:true, content:true, target:true, active:true}).partial()
