import { z } from 'zod';
import { RouteSchema } from './RouteSchema.js';

const GroupSchema = z.object({
  nome: z.string().min(1, 'O campo nome é obrigatório.'),
  descricao: z.string().min(1, 'O campo descrição é obrigatório.'),
  ativo: z.boolean().default(true),
  permissions: z.array(RouteSchema).default([]),
});

const GroupUpdateSchema = GroupSchema.partial();

export { GroupSchema, GroupUpdateSchema };
