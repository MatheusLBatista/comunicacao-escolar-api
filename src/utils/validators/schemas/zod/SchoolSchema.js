import { z } from 'zod';

const taxIdSchema = z
  .string()
  .min(1, 'CNPJ é obrigatório.')
  .refine((doc) => {
    const replacedDoc = doc.replace(/\D/g, '');
    return replacedDoc.length === 14;
  }, 'CNPJ deve conter exatamente 14 caracteres numéricos.')
  .refine((doc) => {
    const replacedDoc = doc.replace(/\D/g, '');
    return /^\d+$/.test(replacedDoc);
  }, 'CNPJ deve conter apenas números.');

const zipCodeSchema = z
  .string()
  .min(1, 'CEP é obrigatório.')
  .refine((zip) => {
    const replacedZip = zip.replace(/\D/g, '');
    return replacedZip.length === 8;
  }, 'CEP deve conter exatamente 8 caracteres numéricos.');

const SchoolSchema = z.object({
  name: z
    .string()
    .min(1, 'Campo nome é obrigatório.')
    .max(100, 'O nome da escola deve ter no máximo 100 caracteres.'),
  tax_id: taxIdSchema,
  address: z.object({
    street: z.string().min(1, 'Campo rua é obrigatório.'),
    city: z.string().min(1, 'Campo cidade é obrigatório.'),
    state: z.string().min(1, 'Campo estado é obrigatório.'),
    zip_code: zipCodeSchema,
  }),
  active: z.boolean().default(true),
});

const SchoolUpdateSchema = SchoolSchema.omit({ tax_id: true }).partial();

export { SchoolSchema, SchoolUpdateSchema };
