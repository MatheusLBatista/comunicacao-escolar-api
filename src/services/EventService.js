import EventRepository from '../repositories/EventRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class EventService {
  constructor() {
    this.repository = new EventRepository();
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
    this.userRepository = new UserRepository();
  }

  async resolveSchoolScope(req) {
    const userId = req?.user_id || req?.user?.id;
    if (!userId) return {};

    const user = await this.userRepository.getById(userId);
    const memberships = Array.isArray(user?.memberships) ? user.memberships : [];

    const schoolIds = [
      ...new Set(memberships.map((m) => m?.school_id?.toString()).filter(Boolean)),
    ];

    if (!schoolIds.length) return {};

    const hasPrivilegedRole = memberships.some(
      (m) => m.role === 'admin' || m.role === 'teacher',
    );
    if (hasPrivilegedRole) return { schoolIds };

    // parent: resolve class_ids dos filhos vinculados
    const studentIds = [
      ...new Set(
        memberships
          .filter((m) => m.role === 'parent')
          .flatMap((m) => m.associated_students ?? [])
          .map((id) => id.toString()),
      ),
    ];

    if (!studentIds.length) return { schoolIds, parentClassIds: [] };

    const students = await Promise.all(
      studentIds.map((id) => this.userRepository.getById(id).catch(() => null)),
    );

    const parentClassIds = [
      ...new Set(
        students
          .filter(Boolean)
          .flatMap((s) =>
            (s?.memberships ?? []).map((m) => m.class_id?.toString()).filter(Boolean),
          ),
      ),
    ];

    return { schoolIds, parentClassIds };
  }

  async _assertSchoolMembership(userId, schoolId) {
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
        customMessage:
          'Você não tem permissão para realizar esta operação nesta escola.',
      });
    }
  }

  async create(parsedData, rawBody = {}) {
    await this.schoolRepository.findById(parsedData.school_id);

    await this._assertSchoolMembership(
      parsedData.created_by,
      parsedData.school_id,
    );

    await this.validateTarget(parsedData.target, parsedData.school_id);
    parsedData.target = this.normalizeTarget(parsedData.target);
    this.validateMeeting(parsedData, rawBody);
    return this.repository.create(parsedData);
  }

  async list(req) {
    const accessScope = await this.resolveSchoolScope(req);
    return this.repository.list(req, accessScope);
  }

  async update(id, parsedData, rawBody = {}, userId = null) {
    const existingEvent = await this.repository.getById(id);

    await this._assertSchoolMembership(userId, existingEvent.school_id);

    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    const merged = {
      ...existingEvent.toObject(),
      ...parsedData,
      target: {
        scope: (parsedData.target?.scope ?? existingEvent.target?.scope) || 'all',
        target_ids: parsedData.target?.target_ids ?? existingEvent.target?.target_ids ?? [],
      },
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
    const targetIds = target?.target_ids ?? [];

    if (targetScope !== 'class') return;

    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'target.target_ids',
        details: [
          {
            path: 'target.target_ids',
            message: 'target_ids é obrigatório quando target.scope for class.',
          },
        ],
        customMessage: 'Para scope=class, informe ao menos uma turma em target_ids.',
      });
    }

    for (const targetId of targetIds) {
      const turma = await this.classRepository.findById(targetId);

      if (!turma) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'target.target_ids',
          details: [
            {
              path: 'target.target_ids',
              message: `Turma ${targetId} não foi encontrada.`,
            },
          ],
          customMessage: 'Um ou mais IDs em target_ids são inválidos.',
        });
      }

      if (schoolId && String(turma.school_id) !== String(schoolId)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'target.target_ids',
          details: [
            {
              path: 'target.target_ids',
              message: `Turma ${targetId} não pertence à escola do evento.`,
            },
          ],
          customMessage: 'Um ou mais IDs em target_ids não pertencem à escola informada.',
        });
      }
    }
  }

  normalizeTarget(target = {}) {
    const targetScope = target?.scope ?? 'all';

    if (targetScope === 'class') {
      return {
        scope: 'class',
        target_ids: Array.isArray(target?.target_ids) ? target.target_ids : [],
      };
    }

    return {
      scope: 'all',
      target_ids: [],
    };
  }
}

export default EventService;
