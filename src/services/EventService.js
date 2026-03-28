import EventRepository from '../repositories/EventRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class EventService {
  constructor() {
    this.repository = new EventRepository();
    this.schoolRepository = new SchoolRepository();
  }

  async create(parsedData, rawBody = {}) {
    await this.schoolRepository.findById(parsedData.school_id);

    this.validateMeetingBusinessRule(parsedData, rawBody);

    const data = await this.repository.create(parsedData);

    return data;
  }

  async list(req) {
    const data = await this.repository.list(req);

    return data;
  }

  validateMeetingBusinessRule(parsedData, rawBody) {
    if (parsedData.type !== 'meeting') {
      return;
    }

    if (parsedData.all_day) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'all_day',
        details: [
          {
            path: 'all_day',
            message: 'Eventos do tipo meeting não podem ser de dia inteiro.',
          },
        ],
        customMessage:
          'Eventos do tipo meeting exigem horário exato e all_day deve ser false.',
      });
    }

    const rawStartDate = rawBody?.start_date;
    const hasExplicitTime =
      typeof rawStartDate === 'string' && /T\d{2}:\d{2}/.test(rawStartDate);

    if (!hasExplicitTime) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'start_date',
        details: [
          {
            path: 'start_date',
            message:
              'Eventos do tipo meeting devem informar data e hora (ex: 2026-03-27T14:30:00.000Z).',
          },
        ],
        customMessage:
          'Para type=meeting, start_date precisa conter horário exato.',
      });
    }
  }
}

export default EventService;
