import MessageRepository from '../repositories/MessageRepository.js';
import ConversationRepository from '../repositories/ConversationRepository.js';
import { CustomError } from '../utils/helpers/index.js';
import { getIO } from '../config/SocketIO.js';

class MessageService {
  constructor() {
    this.repository = new MessageRepository();
    this.conversationRepository = new ConversationRepository();
  }

  async send(conversationId, senderId, parsedData) {
    const conversation = await this.conversationRepository.getById(conversationId);

    this._assertParticipant(conversation, senderId);

    const now = new Date();

    const message = await this.repository.create({
      conversation_id: conversationId,
      sender_id: senderId,
      text: parsedData.text,
      read_by: [{ user_id: senderId, at: now }],
      sent_at: now,
    });

    await this.conversationRepository.updateLastMessageAt(conversationId, now);

    this._emitNewMessage(conversation, senderId, message);

    return message;
  }

  async list(conversationId, userId, query) {
    const conversation = await this.conversationRepository.getById(conversationId);

    this._assertParticipant(conversation, userId);

    return await this.repository.listByConversation(conversationId, query);
  }

  async markAsRead(conversationId, userId) {
    const conversation = await this.conversationRepository.getById(conversationId);

    this._assertParticipant(conversation, userId);

    const marked = await this.repository.markAllAsRead(conversationId, userId);

    this._emitMessagesRead(conversationId, userId);

    return { marked };
  }

  _assertParticipant(conversation, userId) {
    const isParticipant = conversation.participants?.some(
      (p) => p._id?.toString() === userId.toString() || p.toString() === userId.toString(),
    );

    if (!isParticipant) {
      throw new CustomError({
        statusCode: 403,
        errorType: 'forbidden',
        field: 'conversation',
        details: [],
        customMessage: 'Você não é participante desta conversa.',
      });
    }
  }

  _emitNewMessage(conversation, senderId, message) {
    const io = getIO();
    if (!io) return;

    const conversationId = conversation._id.toString();
    const payload = typeof message.toObject === 'function' ? message.toObject() : message;

    io.to(`conversation:${conversationId}`).emit('message:new', payload);

    conversation.participants?.forEach((participant) => {
      const participantId = participant._id?.toString() ?? participant.toString();

      if (participantId !== senderId.toString()) {
        io.to(`user:${participantId}`).emit('message:new', payload);
      }
    });
  }

  _emitMessagesRead(conversationId, userId) {
    const io = getIO();
    if (!io) return;

    io.to(`conversation:${conversationId}`).emit('message:read', {
      conversation_id: conversationId,
      user_id: userId.toString(),
    });
  }
}

export default MessageService;
