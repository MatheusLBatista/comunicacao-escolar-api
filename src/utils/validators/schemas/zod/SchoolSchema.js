import { z } from 'zod';

const taxIdSchema = z
  .string('CNPJ é obrigatório.')
  .refine((doc) => {
    const replacedDoc = doc.replace(/\D/g, '');
    return replacedDoc.length >= 11;
  }, 'CNPJ deve conter no mínimo 11 caracteres.')
  .refine((doc) => {
    const replacedDoc = doc.replace(/\D/g, '');
    return replacedDoc.length <= 14;
  }, 'CNPJ deve conter no máximo 14 caracteres.')
  .refine((doc) => {
    const replacedDoc = doc.replace(/\D/g, '');
    return !!Number(replacedDoc);
  }, 'CNPJ deve conter apenas números.');

const zipCodeSchema = z
  .string()
  .refine((zip) => {
    const replacedZip = zip.replace(/\D/g, '');
    return replacedZip.length === 8;
  }, 'CEP deve conter exatamente 8 caracteres numéricos.');

const SchoolSchema = z.object({
  name: z
    .string()
    .min(1, 'Campo nome é obrigatório.')
    .max(100, 'O nome da escola deve ter no máximo 100 caracteres.'),
  active: z.boolean().default(true),
});

const SchoolUpdateSchema = SchoolSchema.omit({ tax_id: true }).partial();

export { SchoolSchema, SchoolUpdateSchema };
