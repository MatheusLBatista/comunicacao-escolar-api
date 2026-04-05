import EventRepository from '../repositories/EventRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class EventService {
  constructor() {
    this.repository = new EventRepository();
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
  }

  async create(parsedData, rawBody = {}) {
    await this.schoolRepository.findById(parsedData.school_id);
    await this.validateTarget(parsedData.target, parsedData.school_id);
    parsedData.target = this.normalizeTarget(parsedData.target);
    this.validateMeeting(parsedData, rawBody);
    return this.repository.create(parsedData);
  }

  async list(req) {
    return this.repository.list(req);
  }

  async update(id, parsedData, rawBody = {}) {
    const existingEvent = await this.repository.getById(id);

    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    const merged = {
      ...existingEvent.toObject(),
      ...parsedData,
      target: { ...(existingEvent.target || {}), ...(parsedData.target || {}) },
    };

    const normalizedTarget = this.normalizeTarget(merged.target);
    await this.validateTarget(normalizedTarget, merged.school_id);

    if (parsedData.target) {
      parsedData.target = normalizedTarget;
    }

    const isMeeting = merged.type === 'meeting';

    if (isMeeting && merged.all_day) {
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

    if (isMeeting) {
      const isUpdatingStartDate = Object.prototype.hasOwnProperty.call(
        rawBody,
        'start_date',
      );
      const hasExplicitTime =
        typeof rawBody.start_date === 'string' &&
        /T\d{2}:\d{2}/.test(rawBody.start_date);
      const existingDate = existingEvent?.start_date;
      const existingHasTime =
        existingDate instanceof Date &&
        (existingDate.getUTCHours() !== 0 ||
          existingDate.getUTCMinutes() !== 0 ||
          existingDate.getUTCSeconds() !== 0 ||
          existingDate.getUTCMilliseconds() !== 0);

      if (
        (isUpdatingStartDate && !hasExplicitTime) ||
        (!isUpdatingStartDate && !existingHasTime)
      ) {
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

    return this.repository.update(id, parsedData);
  }

  async delete(id) {
    await this.repository.getById(id);
    return this.repository.delete(id);
  }

  validateMeeting(parsedData, rawBody) {
    if (parsedData.type !== 'meeting') return;

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

    const hasExplicitTime =
      typeof rawBody.start_date === 'string' &&
      /T\d{2}:\d{2}/.test(rawBody.start_date);

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

  async validateTarget(target = {}, schoolId = null) {
    const targetScope = target?.scope ?? 'all';
    const targetId = target?.target_id ?? null;

    if (targetScope !== 'class') return;

    if (!targetId) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'target.target_id',
        details: [
          {
            path: 'target.target_id',
            message: 'target_id é obrigatório quando target.scope for class.',
          },
        ],
        customMessage: 'Para scope=class, informe o id da turma.',
      });
    }

    const turma = await this.classRepository.findById(targetId);

    if (!turma) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'target.target_id',
        details: [
          {
            path: 'target.target_id',
            message: 'A turma informada não foi encontrada.',
          },
        ],
        customMessage: 'target.target_id inválido.',
      });
    }

    if (schoolId && String(turma.school_id) !== String(schoolId)) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'target.target_id',
        details: [
          {
            path: 'target.target_id',
            message: 'A turma informada não pertence à escola do evento.',
          },
        ],
        customMessage: 'target.target_id não pertence à escola informada.',
      });
    }
  }

  normalizeTarget(target = {}) {
    const targetScope = target?.scope ?? 'all';

    if (targetScope === 'class') {
      return {
        scope: 'class',
        target_id: target?.target_id ?? null,
      };
    }

    return {
      scope: 'all',
      target_id: null,
    };
  }
}

export default EventService;
