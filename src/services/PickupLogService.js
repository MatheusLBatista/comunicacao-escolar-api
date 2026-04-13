import PickupLogRepository from '../repositories/PickupLogRepository.js';
import PickupAuthorizationRepository from '../repositories/PickupAuthorizationRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class PickupLogService {
  constructor() {
    this.repository = new PickupLogRepository();
    this.pickupAuthorizationRepository = new PickupAuthorizationRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
  }

  async create(parsedData) {
    await this.validateReferences(parsedData);
    this.ensureQrCodeRequiresAuthorization(parsedData);

    return this.repository.create(parsedData);
  }

  async list(req) {
    return this.repository.list(req);
  }

  async update(id, parsedData) {
    const existing = await this.repository.getById(id);

    const merged = {
      ...existing.toObject(),
      ...parsedData,
      picked_up_by: {
        ...(existing.picked_up_by || {}),
        ...(parsedData.picked_up_by || {}),
      },
    };

    await this.validateReferences(merged);
    this.ensureQrCodeRequiresAuthorization(merged);

    const payload = {
      ...parsedData,
    };

    if (parsedData.picked_up_by) {
      payload.picked_up_by = merged.picked_up_by;
    }

    return this.repository.update(id, payload);
  }

  async delete(id) {
    await this.repository.getById(id);

    return this.repository.delete(id);
  }

  ensureQrCodeRequiresAuthorization(data) {
    if (data.method === 'qr_code' && !data.authorization_id) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
        errorType: 'validationError',
        field: 'authorization_id',
        details: [
          {
            path: 'authorization_id',
            message:
              'authorization_id é obrigatório quando method for qr_code.',
          },
        ],
        customMessage:
          'authorization_id é obrigatório para retirada com método qr_code.',
      });
    }
  }

  async validateReferences(parsedData) {
    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    let student = null;
    if (parsedData.student_id) {
      student = await this.userRepository.getById(parsedData.student_id);

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

    if (parsedData.verified_by) {
      const verifier = await this.userRepository.getById(
        parsedData.verified_by,
      );

      const verifierRoles = (verifier.memberships || []).map((m) =>
        String(m?.role || '').toLowerCase(),
      );

      if (
        !verifierRoles.includes('admin') &&
        !verifierRoles.includes('teacher')
      ) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'verified_by',
          details: [
            {
              path: 'verified_by',
              message:
                'verified_by deve referenciar um usuário com membership admin ou teacher.',
            },
          ],
          customMessage:
            'Apenas usuários com role admin ou teacher podem validar retirada.',
        });
      }
    }

    if (parsedData.picked_up_by?.user_id) {
      const pickedUpByUser = await this.userRepository.getById(
        parsedData.picked_up_by.user_id,
      );

      const pickedUpByRoles = (pickedUpByUser.memberships || []).map((m) =>
        String(m?.role || '').toLowerCase(),
      );

      if (!pickedUpByRoles.includes('parent')) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'picked_up_by.user_id',
          details: [
            {
              path: 'picked_up_by.user_id',
              message:
                'picked_up_by.user_id deve referenciar um usuário com membership de responsável.',
            },
          ],
          customMessage:
            'Apenas usuários com role parent podem ser informados em picked_up_by.user_id.',
        });
      }

      if (student && String(pickedUpByUser._id) === String(student._id)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'picked_up_by.user_id',
          details: [
            {
              path: 'picked_up_by.user_id',
              message: 'picked_up_by.user_id deve ser diferente de student_id.',
            },
          ],
          customMessage: 'Quem retira não pode ser o próprio aluno.',
        });
      }
    }

    if (parsedData.authorization_id) {
      const authorization = await this.pickupAuthorizationRepository.getById(
        parsedData.authorization_id,
      );

      if (String(authorization.school_id) !== String(parsedData.school_id)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'authorization_id',
          details: [
            {
              path: 'authorization_id',
              message:
                'authorization_id deve pertencer à mesma escola de school_id.',
            },
          ],
          customMessage:
            'A autorização informada não pertence à escola selecionada.',
        });
      }

      if (String(authorization.student_id) !== String(parsedData.student_id)) {
        throw new CustomError({
          statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY.code,
          errorType: 'validationError',
          field: 'authorization_id',
          details: [
            {
              path: 'authorization_id',
              message:
                'authorization_id deve pertencer ao mesmo aluno de student_id.',
            },
          ],
          customMessage:
            'A autorização informada não pertence ao aluno selecionado.',
        });
      }
    }
  }
}

export default PickupLogService;
