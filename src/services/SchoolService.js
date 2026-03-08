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

  async list(req) {
    const data = await this.repository.list(req);

    return data
  }
}

export default SchoolService;
