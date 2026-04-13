import AuditLogService from '../services/AuditLogService.js';
import { CommonResponse } from '../utils/helpers/index.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

class AuditLogController {
  constructor() {
    this.service = new AuditLogService();
  }

  async list(req, res) {
    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async getById(req, res) {
    const { logId } = req.params;
    objectIdSchema.parse(logId);

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async summary(req, res) {
    const data = await this.service.summary(req);

    return CommonResponse.success(res, data);
  }

  async listByResource(req, res) {
    const { resourceId } = req.params;
    objectIdSchema.parse(resourceId);

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async listByUser(req, res) {
    const { userId } = req.params;
    objectIdSchema.parse(userId);

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }

  async listByStudent(req, res) {
    const { studentId } = req.params;
    objectIdSchema.parse(studentId);

    const data = await this.service.list(req);

    return CommonResponse.success(res, data);
  }
}

export default AuditLogController;
