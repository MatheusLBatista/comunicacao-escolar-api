import PickupAuthorizationRepository from '../repositories/PickupAuthorizationRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class PickupAuthorizationService {
  constructor() {
    this.repository = new PickupAuthorizationRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
  }

  async create(parsedData) {
    await this.validateReferences(parsedData);

    if (parsedData.valid_until <= parsedData.valid_from) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'valid_until',
        details: [
          {
            path: 'valid_until',
            message: 'valid_until deve ser maior que valid_from.',
          },
        ],
        customMessage: 'O período informado é inválido.',
      });
    }

    if (String(parsedData.student_id) === String(parsedData.authorized_by)) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'authorized_by',
        details: [
          {
            path: 'authorized_by',
            message: 'authorized_by deve ser diferente de student_id.',
          },
        ],
        customMessage: 'O responsável autorizado não pode ser o próprio aluno.',
      });
    }

    return this.repository.create(parsedData);
  }

  async update(id, parsedData) {
    const existing = await this.repository.getById(id);

    const merged = {
      ...existing.toObject(),
      ...parsedData,
      authorized_person: {
        ...(existing.authorized_person || {}),
        ...(parsedData.authorized_person || {}),
      },
    };

    await this.validateReferences(parsedData);

    const isUpdatingDates =
      Object.prototype.hasOwnProperty.call(parsedData, 'valid_from') ||
      Object.prototype.hasOwnProperty.call(parsedData, 'valid_until');

    if (isUpdatingDates && merged.valid_until <= merged.valid_from) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'valid_until',
        details: [
          {
            path: 'valid_until',
            message: 'valid_until deve ser maior que valid_from.',
          },
        ],
        customMessage: 'O período informado é inválido.',
      });
    }

    const isUpdatingPeople =
      Object.prototype.hasOwnProperty.call(parsedData, 'student_id') ||
      Object.prototype.hasOwnProperty.call(parsedData, 'authorized_by');

    if (
      isUpdatingPeople &&
      String(merged.student_id) === String(merged.authorized_by)
    ) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'authorized_by',
        details: [
          {
            path: 'authorized_by',
            message: 'authorized_by deve ser diferente de student_id.',
          },
        ],
        customMessage: 'O responsável autorizado não pode ser o próprio aluno.',
      });
    }

    return this.repository.update(id, parsedData);
  }

  async list(req) {
    return this.repository.list(req);
  }

  async validateReferences(parsedData) {
    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    if (parsedData.student_id) {
      const student = await this.userRepository.getById(parsedData.student_id);

      const studentRoles = (student.memberships || []).map((m) =>
        String(m?.role || '').toLowerCase(),
      );

      if (!studentRoles.includes('student')) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'student_id',
          details: [
            {
              path: 'student_id',
              message:
                'student_id deve referenciar um usuário com membership de estudante.',
            },
          ],
          customMessage:
            'Apenas usuários com role student podem ser informados em student_id.',
        });
      }
    }

    if (parsedData.authorized_by) {
      const parent = await this.userRepository.getById(
        parsedData.authorized_by,
      );

      const parentRoles = (parent.memberships || []).map((m) =>
        String(m?.role || '').toLowerCase(),
      );

      if (!parentRoles.includes('parent')) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'authorized_by',
          details: [
            {
              path: 'authorized_by',
              message:
                'authorized_by deve referenciar um usuário com membership de responsável.',
            },
          ],
          customMessage:
            'Apenas usuários com role parent podem ser informados em authorized_by.',
        });
      }
    }
  }
}

export default PickupAuthorizationService;
