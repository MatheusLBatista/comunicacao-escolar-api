import { z } from 'zod';
import mongoose from 'mongoose';

export const SchoolIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'ID inválido',
  });

export const SchoolQuerySchema = z.object({});
