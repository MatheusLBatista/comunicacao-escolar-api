// src/utils/validators/schemas/zod/BaseRotaSchema.js
import { z } from 'zod';
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const BaseRotaSchema = z.object({
  _id: objectIdSchema.optional(),
  route: z.string().min(1, 'O campo route é obrigatório.'),
  domain: z.string().default('localhost'),
});
