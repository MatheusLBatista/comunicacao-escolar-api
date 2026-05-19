import ConversationService from '../services/ConversationService.js';
import AuditLogService from '../services/AuditLogService.js';
import { ConversationSchema } from '../utils/validators/schemas/zod/ConversationSchema.js';
import {
  ConversationIdSchema,
  ConversationQuerySchema,
} from '../utils/validators/schemas/zod/querys/ConversationQuerySchema.js';
import { CommonResponse } from '../utils/helpers/index.js';

class ConversationController {
  constructor() {
    this.service = new ConversationService();
    this.auditLogService = new AuditLogService();
  }


  async findOrCreate(req, res) {
    const { schoolId } = req.params;
    ConversationIdSchema.parse(schoolId);

    const parsedData = ConversationSchema.parse(req.body);
    const userId = req.user_id;

    const { conversation, created } = await this.service.findOrCreate(
      schoolId,
      userId,
      parsedData,
    );

    if (created) {
      this.auditLogService.logAsync(req, {
        schoolId: conversation.school_id,
        resourceType: 'conversation',
        resourceId: conversation._id,
        resourceSummary: 'Conversa iniciada',
        action: 'create',
      });
      return CommonResponse.created(res, conversation);
    }

    return CommonResponse.success(res, conversation);
  }

  async list(req, res) {
    const { schoolId } = req.params;
    ConversationIdSchema.parse(schoolId);

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      await ConversationQuerySchema.parseAsync(query);
    }

    const data = await this.service.list(schoolId, req.user_id, query);

    return CommonResponse.success(res, data);
  }

  async getById(req, res) {
    const { id } = req.params;
    ConversationIdSchema.parse(id);

    const data = await this.service.getById(id, req.user_id);

    return CommonResponse.success(res, data);
  }
}

export default ConversationController;
