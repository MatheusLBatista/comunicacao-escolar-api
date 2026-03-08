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
    await this.validateName(parsedData.name);
    await this.validateTaxId(parsedData.tax_id);

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

  async validateTaxId(tax_id, id = null) {
    const existentTaxId = await this.repository.findByTaxId(tax_id);

    if (existentTaxId) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'tax_id',
        details: [{ path: 'tax_id', message: 'Tax ID already exists.' }],
        customMessage: 'Tax ID already exists.',
      });
    }
  }
}

export default SchoolService;
