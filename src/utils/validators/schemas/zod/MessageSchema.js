import { z } from 'zod';

const MessageSchema = z.object({
  text: z.string().min(1, 'O texto da mensagem não pode ser vazio.'),
});

export { MessageSchema };
