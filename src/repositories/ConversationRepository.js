import ConversationModel from '../models/Conversation.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class ConversationRepository {
  constructor({ conversationModel = ConversationModel } = {}) {
    this.model = conversationModel;
  }

  async create(data) {
    const conversation = new this.model(data);
    return await conversation.save();
  }

  async findExisting(schoolId, participantIds) {
    return await this.model.findOne({
      school_id: schoolId,
      participants: { $all: participantIds, $size: participantIds.length },
      active: true,
    });
  }

  async listByUser(schoolId, userId, query = {}) {
    const { type, page = 1 } = query;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);

    const filters = {
      school_id: schoolId,
      participants: userId,
      active: true,
    };

    if (type) filters.type = type;

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { last_message_at: -1 },
      populate: [{ path: 'participants', select: 'full_name email' }],
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) =>
      typeof doc.toObject === 'function' ? doc.toObject() : doc,
    );

    return result;
  }

  async getById(id) {
    const data = await this.model
      .findById(id)
      .populate('participants', 'full_name email');

    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Conversation',
        details: [],
        customMessage: messages.error.resourceNotFound('Conversation'),
      });
    }

    return data;
  }

  async updateLastMessageAt(id, date, text) {
    return await this.model.findByIdAndUpdate(
      id,
      { last_message_at: date, last_message_text: text ?? null },
      { new: true },
    );
  }
}

export default ConversationRepository;
