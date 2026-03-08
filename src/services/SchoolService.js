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
    const data = await this.repository.create(parsedData);

    return data;
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }

  async validateName(name, id = null) {
    const existentName = await this.repository.findByName(name);

    if (existentName) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'name',
        details: [{ path: 'name', message: 'Name already exists.' }],
        customMessage: 'Name already exists.',
      });
    }
  }
}

export default SchoolService;
