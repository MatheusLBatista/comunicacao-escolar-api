import { z } from 'zod';
import mongoose from 'mongoose';

export const SchoolIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'ID inválido',
  });

export const SchoolQuerySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome deve conter pelo menos 1 caractere')
    .optional(),

  tax_id: z
    .string()
    .min(3, 'O CNPJ deve conter pelo menos 3 caracteres')
    .optional(),

  active: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional(),

  city: z
    .string()
    .min(1, 'A cidade deve conter pelo menos 1 caractere')
    .optional(),

  state: z
    .string()
    .min(2, 'O estado deve conter pelo menos 2 caracteres')
    .optional(),

  zip_code: z
    .string()
    .min(3, 'O CEP deve conter pelo menos 3 caracteres')
    .optional(),

  address: z
    .string()
    .min(1, 'O endereço deve conter pelo menos 1 caractere')
    .optional(),

  page: z.coerce
    .number()
    .int()
    .positive({ message: 'A página deve ser um número positivo' })
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .positive({ message: 'O limite deve ser um número positivo' })
    .max(100, { message: 'O limite máximo permitido é 100' })
    .optional(),
});
