import MessageModel from '../models/Message.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class MessageRepository {
  constructor({ messageModel = MessageModel } = {}) {
    this.model = messageModel;
  }

  async create(data) {
    const message = new this.model(data);
    return await message.save();
  }

  async listByConversation(conversationId, query = {}) {
    const { page = 1 } = query;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);

    const filters = {
      conversation_id: conversationId,
      active: true,
    };

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { sent_at: -1 },
      populate: [{ path: 'sender_id', select: 'full_name email' }],
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) =>
      typeof doc.toObject === 'function' ? doc.toObject() : doc,
    );

    return result;
  }

  async markAllAsRead(conversationId, userId) {
    const now = new Date();

    const result = await this.model.updateMany(
      {
        conversation_id: conversationId,
        active: true,
        sender_id: { $ne: userId },
        'read_by.user_id': { $ne: userId },
      },
      {
        $push: { read_by: { user_id: userId, at: now } },
      },
    );

    return result.modifiedCount;
  }

  async getById(id) {
    const data = await this.model.findById(id);

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Message',
        details: [],
        customMessage: messages.error.resourceNotFound('Message'),
      });
    }

    return data;
  }
}

export default MessageRepository;
