import DailyLogRepository from '../repositories/DailyLogRepository.js';
import DailyLogTemplateRepository from '../repositories/DailyLogTemplateRepository.js';
import SchoolRepository from '../repositories/SchoolRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import mongoose from 'mongoose';
import compress from '../config/SharpConfig.js';
import minioClient from '../config/MinIO.js';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class DailyLogService {
  constructor() {
    this.repository = new DailyLogRepository();
    this.templateRepository = new DailyLogTemplateRepository();
    this.schoolRepository = new SchoolRepository();
    this.userRepository = new UserRepository();
  }

  async resolveAccessScope(req) {
    const userId = req?.user_id || req?.user?.id;

    if (!userId) {
      return {};
    }

    const user = await this.userRepository.getById(userId);
    const memberships = Array.isArray(user?.memberships)
      ? user.memberships
      : [];

    const isAdminOrTeacher = memberships.some(
      (membership) =>
        membership?.role === 'admin' || membership?.role === 'teacher',
    );

    if (isAdminOrTeacher) {
      return {};
    }

    const schoolId = req?.query?.school_id?.toString();
    const parentMemberships = memberships.filter((membership) => {
      if (membership?.role !== 'parent') {
        return false;
      }

      if (!schoolId) {
        return true;
      }

      return membership?.school_id?.toString() === schoolId;
    });

    if (!parentMemberships.length) {
      return {};
    }

    const studentIds = [
      ...new Set(
        parentMemberships.flatMap((membership) =>
          Array.isArray(membership?.associated_students)
            ? membership.associated_students
                .map((studentId) => studentId?.toString())
                .filter(Boolean)
            : [],
        ),
      ),
    ];

    return { studentIds };
  }

  async create(parsedData) {
    await this.validateReferences(parsedData);

    const data = await this.repository.create(parsedData);
    return data;
  }

  async list(req) {
    const accessScope = await this.resolveAccessScope(req);
    const data = await this.repository.list(req, accessScope);
    return data;
  }

  async update(id, parsedData, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);
    await this.validateReferences(parsedData);

    const data = await this.repository.update(id, parsedData);
    return data;
  }

  async delete(id, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);

    const data = await this.repository.delete(id);
    return data;
  }

  async markAsRead(id, req) {
    const accessScope = await this.resolveAccessScope(req);
    await this.repository.getById(id, accessScope);

    const data = await this.repository.markAsRead(id);
    return data;
  }

  async validateReferences(parsedData) {
    if (parsedData.school_id) {
      await this.schoolRepository.findById(parsedData.school_id);
    }

    if (parsedData.student_id) {
      await this.userRepository.getById(parsedData.student_id);
    }

    if (parsedData.teacher_id) {
      await this.userRepository.getById(parsedData.teacher_id);
    }

    if (parsedData.dailylogtemplate_id) {
      await this.templateRepository.getById(parsedData.dailylogtemplate_id);
    }
  }

  async uploadAttachments(id, req) {
    const files = req.files;

    const accessScope = await this.resolveAccessScope(req);

    if (!files || files.length === 0) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'badRequest',
        field: 'files',
        details: [{ path: 'files', message: 'Nenhum arquivo foi enviado ou o arquivo está vazio.' }],
        customMessage: 'Nenhum arquivo foi enviado ou o arquivo está vazio.',
      });
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new CustomError({
          statusCode: HttpStatusCodes.PAYLOAD_TOO_LARGE.code,
          errorType: 'payloadTooLarge',
          field: 'files',
          details: [{ path: 'files', message: 'Arquivo é superior a 10 MB.' }],
          customMessage: 'O arquivo é maior do que 10 MB.',
        });
      }
    }

    await this.repository.getById(id, accessScope);

    for (const file of files) {
      const image = await compress(file.buffer);
      const obj = new mongoose.Types.ObjectId().toString();
      const objectName = `${obj}.${image[1].format}`;

      await this.repository.addAttachment(id, objectName);

      try {
        await minioClient.putObject(process.env.MINIO_BUCKET, objectName, image[0], {
          'Content-Type': file.mimetype,
        });
      } catch (error) {
        await this.repository.removeAttachment(id, objectName);
        throw new Error(error);
      }
    }

    const data = await this.repository.getById(id);
    return data;
  }
}

export default DailyLogService;
