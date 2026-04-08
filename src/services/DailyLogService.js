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

  async create(parsedData) {
    await this.validateReferences(parsedData);

    const data = await this.repository.create(parsedData);
    return data;
  }

  async list(req) {
    const data = await this.repository.list(req);
    return data;
  }

  async update(id, parsedData) {
    await this.repository.getById(id);
    await this.validateReferences(parsedData);

    const data = await this.repository.update(id, parsedData);
    return data;
  }

  async delete(id) {
    await this.repository.getById(id);

    const data = await this.repository.delete(id);
    return data;
  }

  async markAsRead(id) {
    await this.repository.getById(id);

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
