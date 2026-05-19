import DailyLogTemplateRepository from '../repositories/DailyLogTemplateRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import AuditLogService from './AuditLogService.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class DailyLogTemplateService {
  constructor() {
    this.repository = new DailyLogTemplateRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
    this.auditLogService = new AuditLogService();
  }

  async _assertSchoolMembership(schoolId, req) {
    const userId = req?.user_id || req?.user?.id;
    if (!userId || !schoolId) return;

    const user = await this.userRepository.getById(userId);
    const belongs = (user.memberships || []).some(
      (m) => m?.school_id?.toString() === schoolId?.toString(),
    );

    if (!belongs) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'school_id',
        details: [],
        customMessage: 'Você não tem acesso a este template.',
      });
    }
  }

  async create(parsedData, req) {
    await this.validateReferences(parsedData);

    const data = await this.repository.create(parsedData);

    this.auditLogService.logAsync(req, {
      schoolId: data.school_id,
      resourceType: 'template',
      resourceId: data._id,
      resourceSummary: `Template criado: ${data.name || ''}`,
      action: 'create',
    });

    return data;
  }

  async list(req) {
    const data = await this.repository.list(req);
    return data;
  }

  async update(id, parsedData, req) {
    const template = await this.repository.getById(id);
    await this._assertSchoolMembership(template.school_id, req);
    await this.validateReferences(parsedData);

    const data = await this.repository.update(id, parsedData);

    this.auditLogService.logAsync(req, {
      schoolId: template.school_id,
      resourceType: 'template',
      resourceId: id,
      resourceSummary: `Template atualizado: ${template.name || ''}`,
      action: 'update',
    });

    return data;
  }

  async delete(id, req) {
    const template = await this.repository.getById(id);
    await this._assertSchoolMembership(template.school_id, req);

    const data = await this.repository.delete(id);

    this.auditLogService.logAsync(req, {
      schoolId: template.school_id,
      resourceType: 'template',
      resourceId: id,
      resourceSummary: `Template removido: ${template.name || ''}`,
      action: 'delete',
    });

    return data;
  }

  async validateReferences(parsedData) {
    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    if (parsedData.student_id) {
      await this.userRepository.getById(parsedData.student_id);
    }
  }
}

export default DailyLogTemplateService;
