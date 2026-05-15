import { z } from 'zod';
import ObjectIdSchema from './ObjectIdSchema.js';

const PickupLogPickedUpBySchema = z.object({
  user_id: ObjectIdSchema.nullable().optional().default(null),
  name: z.string().min(1, 'Campo picked_up_by.name é obrigatório.'),
  document: z.string().min(1, 'Campo picked_up_by.document é obrigatório.'),
});

const PickupLogSchema = z.object({
  school_id: ObjectIdSchema,
  student_id: ObjectIdSchema,
  authorization_id: ObjectIdSchema.nullable().optional().default(null),
  picked_up_by: PickupLogPickedUpBySchema,
  method: z.enum(['qr_code', 'manual'], {
    message: 'Campo method deve ser qr_code ou manual.',
  }),
  departure_time: z.coerce.date({ message: 'departure_time inválido.' }),
  verified_by: ObjectIdSchema,
  notes: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
});

const PickupLogUpdateSchema = PickupLogSchema.partial().extend({
  picked_up_by: PickupLogPickedUpBySchema.partial().optional(),
});

export { PickupLogSchema, PickupLogUpdateSchema };
