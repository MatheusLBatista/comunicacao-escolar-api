// src/utils/validators/schemas/zod/RotaSchema.js
import { z } from 'zod';
import { BaseRotaSchema } from './BaseRotaSchema.js';

const RotaSchema = BaseRotaSchema.extend({
  active: z.boolean().default(true),
  get: z.boolean().default(false),
  post: z.boolean().default(false),
  put: z.boolean().default(false),
  patch: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const RotaUpdateSchema = RotaSchema.partial();

export { RotaSchema, RotaUpdateSchema };
