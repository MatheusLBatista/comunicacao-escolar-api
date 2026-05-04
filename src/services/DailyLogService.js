import DailyLogRepository from '../repositories/DailyLogRepository.js';
import DailyLogTemplateRepository from '../repositories/DailyLogTemplateRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';

class DailyLogService {
  constructor() {
    this.repository = new DailyLogRepository();
    this.templateRepository = new DailyLogTemplateRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
  }

  async resolveAccessScope(req) {
    const userId = req?.user_id || req?.user?.id;

    if (!userId) {
      return {};
    }

    const user = await this.userRepository.getById(userId);
    const memberships = Array.isArray(user?.memberships)
      ? user.memberships
      : [];

    const isAdminOrTeacher = memberships.some(
      (membership) =>
        membership?.role === 'admin' || membership?.role === 'teacher',
    );

    if (isAdminOrTeacher) {
      return {};
    }

    const schoolId = req?.query?.school_id?.toString();
    const parentMemberships = memberships.filter((membership) => {
      if (membership?.role !== 'parent') {
        return false;
      }

      if (!schoolId) {
        return true;
      }

      return membership?.school_id?.toString() === schoolId;
    });

    if (!parentMemberships.length) {
      return {};
    }

    const studentIds = [
      ...new Set(
        parentMemberships.flatMap((membership) =>
          Array.isArray(membership?.associated_students)
            ? membership.associated_students
                .map((studentId) => studentId?.toString())
                .filter(Boolean)
            : [],
        ),
      ),
    ];

    return { studentIds };
  }

  async create(parsedData) {
    await this.validateReferences(parsedData);

    const data = await this.repository.create(parsedData);
    return data;
  }

  async list(req) {
    const accessScope = await this.resolveAccessScope(req);
    const data = await this.repository.list(req, accessScope);
    return data;
  }

  async update(id, parsedData, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);
    await this.validateReferences(parsedData);

    const data = await this.repository.update(id, parsedData);
    return data;
  }

  async delete(id, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);

    const data = await this.repository.delete(id);
    return data;
  }

  async markAsRead(id, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);

    const data = await this.repository.markAsRead(id);
    return data;
  }

  async validateReferences(parsedData) {
    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    if (parsedData.student_id) {
      await this.userRepository.getById(parsedData.student_id);
    }

    if (parsedData.teacher_id) {
      await this.userRepository.getById(parsedData.teacher_id);
    }

    if (parsedData.dailylogtemplate_id) {
      await this.templateRepository.getById(parsedData.dailylogtemplate_id);
    }
  }
}

export default DailyLogService;
