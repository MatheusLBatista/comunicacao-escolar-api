import MessageService from '../services/MessageService.js';
import { MessageSchema } from '../utils/validators/schemas/zod/MessageSchema.js';
import { MessageQuerySchema } from '../utils/validators/schemas/zod/querys/MessageQuerySchema.js';
import { ConversationIdSchema } from '../utils/validators/schemas/zod/querys/ConversationQuerySchema.js';
import { CommonResponse, HttpStatusCodes } from '../utils/helpers/index.js';

class MessageController {
  constructor() {
    this.service = new MessageService();
  }

  async send(req, res) {
    const { conversationId } = req.params;
    ConversationIdSchema.parse(conversationId);

    const parsedData = MessageSchema.parse(req.body);
    const userId = req.user_id;

    const data = await this.service.send(conversationId, userId, parsedData);

    return CommonResponse.created(res, data);
  }

  async list(req, res) {
    const { conversationId } = req.params;
    ConversationIdSchema.parse(conversationId);

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await MessageQuerySchema.parseAsync(query);
    }

    const data = await this.service.list(conversationId, req.user_id, query);

    return CommonResponse.success(res, data);
  }

  async markAsRead(req, res) {
    const { conversationId } = req.params;
    ConversationIdSchema.parse(conversationId);

    const data = await this.service.markAsRead(conversationId, req.user_id);

    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Mensagens marcadas como lidas.',
    );
  }
}

export default MessageController;
