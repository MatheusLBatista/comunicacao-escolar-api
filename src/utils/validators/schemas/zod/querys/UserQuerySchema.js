import { z } from 'zod';
import mongoose from 'mongoose';

export const UserIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'ID inválido',
  });

export const UserQuerySchema = z.object({
  full_name: z
    .string()
    .optional()
    .refine((val) => !val || val.trim().length > 0, {
      message: 'Nome não pode ser vazio',
    })
    .transform((val) => val?.trim()),
  email: z
    .union([z.string().email('Formato de email inválido'), z.undefined()])
    .optional(),
  role: z
    .string()
    .optional()
    .refine(
      (val) => !val || ['admin', 'teacher', 'parent', 'student'].includes(val),
      { message: "Role deve ser 'admin', 'teacher', 'parent' ou 'student'" },
    ),
  active: z
    .string()
    .optional()
    .refine((value) => !value || value === 'true' || value === 'false', {
      message: "Active deve ser 'true' ou 'false'",
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: 'Page deve ser um número inteiro maior que 0',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
      message: 'Limit deve ser um número inteiro entre 1 e 100',
    }),
});
