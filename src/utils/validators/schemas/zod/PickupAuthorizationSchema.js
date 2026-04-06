import { z } from 'zod';
import ObjectIdSchema from './ObjectIdSchema.js';

const PickupAuthorizationSchema = z.object({
  school_id: ObjectIdSchema,
  student_id: ObjectIdSchema,
  authorized_by: ObjectIdSchema,
  authorized_person: z.object({
    name: z.string().min(1, 'Campo name é obrigatório.'),
    document: z.string().min(1, 'Campo document é obrigatório.'),
    relationship: z.string().optional().default(''),
    photo_url: z.string().url().nullable().optional().default(null),
  }),
  qr_code: z.string().min(1, 'Campo qr_code é obrigatório.').optional(),
  valid_from: z.coerce.date({ message: 'valid_from inválido.' }),
  valid_until: z.coerce.date({ message: 'valid_until inválido.' }),
  used: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

const PickupAuthorizationUpdateSchema = PickupAuthorizationSchema.partial();

export { PickupAuthorizationSchema, PickupAuthorizationUpdateSchema };
