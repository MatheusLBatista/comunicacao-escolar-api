import SchoolRepository from '../repositories/SchoolRepository.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../utils/helpers/index.js';

class SchoolService {
  constructor() {
    this.repository = new SchoolRepository();
  }

  async create(parsedData) {
    const existingSchool = await this.repository.findAny();

    if (existingSchool) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'validationError',
        field: 'School',
        details: [],
        customMessage: 'Uma escola já existe no sistema.',
      });
    }

    const data = await this.repository.create(parsedData);

    return data;
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }

  async update(id, parsedData) {
    await this.ensureSchoolExists(id);

    delete parsedData.tax_id;

    const data = await this.repository.update(id, parsedData);
    return data;
  }

  async delete(id) {
    await this.ensureSchoolExists(id);

    const data = await this.repository.delete(id);
    return data;
  }

  async ensureSchoolExists(id) {
    const existentSchool = await this.repository.findById(id);
    if (!existentSchool) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'School',
        details: [],
        customMessage: messages.error.resourceNotFound('School'),
      });
    }

    return existentSchool;
  }
}

export default SchoolService;
