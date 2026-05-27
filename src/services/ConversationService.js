import ConversationRepository from '../repositories/ConversationRepository.js';
import MessageRepository from '../repositories/MessageRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import { CustomError } from '../utils/helpers/index.js';

class ConversationService {
  constructor() {
    this.repository = new ConversationRepository();
    this.messageRepository = new MessageRepository();
    this.userRepository = new UserRepository();
    this.schoolRepository = new SchoolRepository();
  }

  async findOrCreate(schoolId, currentUserId, parsedData) {
    const { participant_id, type } = parsedData;

    await this.schoolRepository.findById(schoolId);
    await this.userRepository.getById(participant_id);

    this._assertDifferentUsers(currentUserId, participant_id);

    await this._assertSameSchool(schoolId, participant_id);

    const participantIds = [currentUserId, participant_id];

    const existing = await this.repository.findExisting(
      schoolId,
      participantIds,
    );

    if (existing) {
      return { conversation: existing, created: false };
    }

    const conversation = await this.repository.create({
      school_id: schoolId,
      participants: participantIds,
      type,
    });

    return { conversation, created: true };
  }

  async list(schoolId, userId, query) {
    const result = await this.repository.listByUser(schoolId, userId, query);
    const ids = result.docs.map((c) => c._id.toString());
    const unreadMap = await this.messageRepository.countUnreadByConversations(ids, userId);
    result.docs = result.docs.map((c) => ({
      ...c,
      unread_count: unreadMap[c._id.toString()] ?? 0,
    }));
    return result;
  }

  async getById(id, userId) {
    const conversation = await this.repository.getById(id);

    this._assertParticipant(conversation, userId);

    return conversation;
  }

  _assertDifferentUsers(currentUserId, participantId) {
    if (currentUserId.toString() === participantId.toString()) {
      throw new CustomError({
        statusCode: 400,
        errorType: 'validationError',
        field: 'participant_id',
        details: [],
        customMessage: 'Não é possível criar uma conversa consigo mesmo.',
      });
    }
  }

  async _assertSameSchool(schoolId, userId) {
    const user = await this.userRepository.getById(userId);

    const belongsToSchool = user.memberships?.some(
      (m) => m.school_id?.toString() === schoolId.toString(),
    );

    if (!belongsToSchool) {
      throw new CustomError({
        statusCode: 403,
        errorType: 'forbidden',
        field: 'participant_id',
        details: [],
        customMessage: 'O participante não pertence a esta escola.',
      });
    }
  }

  _assertParticipant(conversation, userId) {
    const isParticipant = conversation.participants?.some(
      (p) =>
        p._id?.toString() === userId.toString() ||
        p.toString() === userId.toString(),
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
}

export default ConversationService;
