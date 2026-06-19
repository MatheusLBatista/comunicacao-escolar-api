import PickupAuthorizationRepository from '../repositories/PickupAuthorizationRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';
import compress from '../config/SharpConfig.js';
import minioClient from '../config/MinIO.js';
import mongoose from 'mongoose';
import 'dotenv/config';

class PickupAuthorizationService {
  constructor() {
    this.repository = new PickupAuthorizationRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
  }

  async resolveAccessScope(req) {
    const userId = req?.user_id || req?.user?.id;

    if (!userId) return {};

    const user = await this.userRepository.getById(userId);
    const memberships = Array.isArray(user?.memberships)
      ? user.memberships
      : [];

    const isAdmin = memberships.some((m) => m?.role === 'admin');
    if (isAdmin) return {};

    const isTeacher = memberships.some((m) => m?.role === 'teacher');
    if (isTeacher) {
      const schoolId = req?.query?.school_id?.toString() || null;
      const studentIds = await this.userRepository.findStudentIdsByTeacherId(userId, schoolId);
      return { studentIds };
    }

    const schoolId = req?.query?.school_id?.toString();
    const parentMemberships = memberships.filter((m) => {
      if (m?.role !== 'parent') return false;
      if (!schoolId) return true;
      return m?.school_id?.toString() === schoolId;
    });

    if (!parentMemberships.length) return { studentIds: [] };

    const studentIds = [
      ...new Set(
        parentMemberships.flatMap((m) =>
          Array.isArray(m?.associated_students)
            ? m.associated_students.map((id) => id?.toString()).filter(Boolean)
            : [],
        ),
      ),
    ];

    return { studentIds };
  }

  async create(parsedData, req) {
    await this.validateReferences(parsedData);

    const requesterId = req?.user_id || req?.user?.id;
    if (requesterId && parsedData.student_id) {
      const requester = await this.userRepository.getById(requesterId);
      const isParent = requester.memberships?.some((m) => m?.role === 'parent');

      if (isParent) {
        const studentIdStr = parsedData.student_id?.toString();
        const ownsStudent = (requester.memberships || [])
          .filter((m) => m?.role === 'parent')
          .some(
            (m) =>
              Array.isArray(m.associated_students) &&
              m.associated_students.some((s) => s?.toString() === studentIdStr),
          );

        if (!ownsStudent) {
          throw new CustomError({
            statusCode: HttpStatusCodes.FORBIDDEN.code,
            errorType: 'forbidden',
            field: 'student_id',
            details: [
              {
                path: 'student_id',
                message:
                  'Você só pode criar autorizações de saída para seus próprios filhos.',
              },
            ],
            customMessage:
              'Você não tem permissão para criar uma autorização para este aluno.',
          });
        }
      }
    }

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
    const accessScope = await this.resolveAccessScope(req);
    return this.repository.list(req, accessScope);
  }

  async delete(id) {
    await this.repository.getById(id);

    return this.repository.delete(id);
  }

  async uploadPhoto(req, id) {
    const userId = req.user_id;
    const file = req.file;

    if (!file) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'badRequest',
        field: 'photo',
        details: [{ path: 'photo', message: 'Nenhum arquivo foi enviado.' }],
        customMessage: 'Nenhum arquivo foi enviado.',
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new CustomError({
        statusCode: HttpStatusCodes.PAYLOAD_TOO_LARGE.code,
        errorType: 'payloadTooLarge',
        field: 'photo',
        details: [{ path: 'photo', message: 'Arquivo é superior a 10 MB.' }],
        customMessage: 'O arquivo é maior do que 10 MB.',
      });
    }

    const auth = await this.repository.getById(id);

    const user = await this.userRepository.getById(userId);
    const isAdmin = user?.memberships?.some((m) => m.role === 'admin');

    if (!isAdmin && auth.authorized_by?.toString() !== userId?.toString()) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'pickup_authorization',
        details: [],
        customMessage: 'Você não tem permissão para editar esta autorização.',
      });
    }

    const image = await compress(file.buffer);
    const objectName = `${new mongoose.Types.ObjectId().toString()}.${image[1].format}`;

    await this.repository.updatePhoto(id, objectName);

    try {
      await minioClient.putObject(process.env.MINIO_BUCKET, objectName, image[0], {
        'Content-Type': file.mimetype,
      });
    } catch (error) {
      await this.repository.removePhoto(id);
      throw new Error(error);
    }

    return this.repository.getById(id);
  }

  async deletePhoto(req, id) {
    const userId = req.user_id;
    const auth = await this.repository.getById(id);

    const user = await this.userRepository.getById(userId);
    const isAdmin = user?.memberships?.some((m) => m.role === 'admin');

    if (!isAdmin && auth.authorized_by?.toString() !== userId?.toString()) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'pickup_authorization',
        details: [],
        customMessage: 'Você não tem permissão para editar esta autorização.',
      });
    }

    const objectName = auth.authorized_person?.photo_url;

    if (!objectName) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'notFound',
        field: 'photo',
        details: [{ path: 'photo', message: 'Esta autorização não possui foto.' }],
        customMessage: 'Nenhuma foto encontrada para esta autorização.',
      });
    }

    await this.repository.removePhoto(id);

    try {
      await minioClient.removeObject(process.env.MINIO_BUCKET, objectName);
    } catch (error) {
      console.error('Erro ao remover foto do MinIO:', error);
    }

    return { message: 'Foto removida com sucesso.' };
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
