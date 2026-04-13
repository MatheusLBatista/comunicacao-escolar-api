import AuditLogRepository from '../repositories/AuditLogRepository.js';

class AuditLogService {
  constructor() {
    this.repository = new AuditLogRepository();
  }

  async list(req) {
    return this.repository.list(req);
  }

  async summary(req) {
    return this.repository.summary(req);
  }

  async create(data) {
    return this.repository.create(data);
  }
}

export default AuditLogService;
