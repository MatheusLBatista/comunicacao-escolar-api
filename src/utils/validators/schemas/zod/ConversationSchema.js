import { z } from 'zod';
import ObjectIdSchema from './ObjectIdSchema.js';

const ConversationSchema = z.object({
  participant_id: ObjectIdSchema,
  type: z.enum(['private', 'daily_log_reply']).optional().default('private'),
});

export { ConversationSchema };
