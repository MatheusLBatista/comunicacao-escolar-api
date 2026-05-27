import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import UserRepository from '../repositories/UserRepository.js';
import GroupModel from '../models/Group.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../utils/helpers/index.js';
import minioClient from '../config/MinIO.js';
import compress from '../config/SharpConfig.js';
import emailService from './EmailService.js';
import SchoolRepository from '../repositories/SchoolRepository.js';

class UserService {
  constructor() {
    this.repository = new UserRepository();
    this.schoolRepository = new SchoolRepository();
  }

  async createAdmin(parsedData) {
    const existente = await this.repository.getByEmail(parsedData.email);
    if (existente) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'duplicateEntry',
        field: 'email',
        details: [{ path: 'email', message: 'Email já está em uso.' }],
        customMessage: 'Email já está em uso.',
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(parsedData.password, saltRounds);

    const userData = {
      full_name: parsedData.full_name,
      email: parsedData.email,
      password: passwordHash,
      active: parsedData.active ?? true,
      memberships: [],
    };

    const data = await this.repository.create(userData);
    return data;
  }

  async getBasicUserGroup() {
    return GroupModel.findOne({ nome: 'BasicUser' }).lean();
  }

  async createAtSchool(schoolId, parsedData) {
    await this.validateEmail(parsedData.email);

    const senha = parsedData.password || this.generateTempPassword();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(senha, saltRounds);

    const membership = {
      school_id: schoolId,
      role: parsedData.role,
      class_id: parsedData.class_id || null,
      associated_students: parsedData.associated_students || [],
    };

    const existente = await this.repository.getByEmail(parsedData.email);

    if (existente) {
      const jaMembro = existente.memberships?.some(
        (m) => m.school_id?.toString() === schoolId,
      );
      if (jaMembro) {
        throw new CustomError({
          statusCode: HttpStatusCodes.CONFLICT.code,
          errorType: 'duplicateEntry',
          field: 'email',
          details: [
            { path: 'email', message: 'Usuário já vinculado a esta escola.' },
          ],
          customMessage: 'Usuário já vinculado a esta escola.',
        });
      }

      existente.memberships.push(membership);
      const updated = await this.repository.update(existente._id, {
        memberships: existente.memberships,
      });
      return updated;
    }

    const userData = {
      full_name: parsedData.full_name,
      email: parsedData.email,
      password: passwordHash,
      active: parsedData.active ?? true,
      memberships: [membership],
    };

    const basicUserGroup = await this.getBasicUserGroup();
    if (basicUserGroup) {
      userData.groups = [basicUserGroup._id];
      userData.permissions = basicUserGroup.permissions || [];
    }

    const data = await this.repository.create(userData);
    return data;
  }

  async linkToSchool(schoolId, parsedData) {
    let usuario;
    if (parsedData.user_id) {
      usuario = await this.repository.getById(parsedData.user_id);
    } else {
      usuario = await this.repository.getByEmail(parsedData.email);
    }

    if (usuario) {
      const existingMembership = Array.isArray(usuario.memberships)
        ? usuario.memberships.find((m) => m.school_id?.toString() === schoolId)
        : null;

      if (existingMembership?.active !== false) {
        throw new CustomError({
          statusCode: HttpStatusCodes.CONFLICT.code,
          errorType: 'duplicateEntry',
          field: 'school_id',
          details: [{ path: 'school_id', message: 'Usuário já vinculado a esta escola.' }],
          customMessage: 'Usuário já vinculado a esta escola.',
        });
      }

      if (existingMembership) {
        existingMembership.active = true;
        existingMembership.deactivated_at = null;
        existingMembership.role = parsedData.role;
        const atualizado = await this.repository.update(usuario._id, {
          memberships: usuario.memberships,
        });
        return { _id: atualizado._id, full_name: atualizado.full_name, email: atualizado.email };
      }
    }

    let studentId = null;
    if (parsedData.role === 'parent' && parsedData.student) {
      const alunoData = {
        full_name: parsedData.student.full_name,
        auth_provider: 'local',
        active: true,
        memberships: [
          {
            school_id: schoolId,
            role: 'student',
            class_id: parsedData.student.class_id || null,
          },
        ],
      };
      const alunoCriado = await this.repository.create(alunoData);
      studentId = alunoCriado._id;
    }

    const membership = {
      school_id: schoolId,
      role: parsedData.role,
      associated_students: studentId ? [studentId] : [],
    };

    if (!usuario) {
      const email = parsedData.email;
      const pendente = await this.repository.create({
        full_name: email.split('@')[0],
        email,
        auth_provider: 'local',
        active: false,
        memberships: [membership],
      });

      this.schoolRepository.findById(schoolId).then((school) => {
        if (school) {
          emailService.enviarEmailConviteEscola(email, school.name, parsedData.role).catch(() => {});
        }
      }).catch(() => {});

      return { _id: pendente._id, full_name: pendente.full_name, email: pendente.email };
    }

    const membershipsAtualizadas = [...(usuario.memberships || []), membership];
    const atualizado = await this.repository.update(usuario._id, {
      memberships: membershipsAtualizadas,
    });

    this.schoolRepository
      .findById(schoolId)
      .then((school) => {
        if (school && usuario.email) {
          emailService
            .enviarEmailVinculo(
              usuario.full_name,
              usuario.email,
              parsedData.role,
              school.name,
            )
            .catch(() => {});
        }
      })
      .catch(() => {});

    return {
      _id: atualizado._id,
      full_name: atualizado.full_name,
      email: atualizado.email,
    };
  }

  async addStudentToParent(schoolId, userId, parsedData) {
    const pai = await this.repository.getById(userId);

    const membership = Array.isArray(pai.memberships)
      ? pai.memberships.find(
          (m) => m.school_id?.toString() === schoolId && m.role === 'parent',
        )
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: 'Usuário não é responsável nesta escola.',
      });
    }

    const alunoData = {
      full_name: parsedData.full_name,
      auth_provider: 'local',
      active: true,
      memberships: [
        {
          school_id: schoolId,
          role: 'student',
          class_id: parsedData.class_id,
        },
      ],
    };

    const alunoCriado = await this.repository.create(alunoData);

    membership.associated_students.push(alunoCriado._id);
    const atualizado = await this.repository.update(pai._id, {
      memberships: pai.memberships,
    });

    return atualizado;
  }

  _stripSensitiveFields(userObj) {
    const obj =
      typeof userObj.toObject === 'function'
        ? userObj.toObject()
        : { ...userObj };
    delete obj.fcm_tokens;
    delete obj.permissions;
    delete obj.groups;
    return obj;
  }

  async removeStudentFromParent(schoolId, userId, studentId) {
    const pai = await this.repository.getById(userId);

    const membership = Array.isArray(pai.memberships)
      ? pai.memberships.find(
          (m) => m.school_id?.toString() === schoolId && m.role === 'parent',
        )
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'membership',
        details: [],
        customMessage: 'Usuário não é responsável nesta escola.',
      });
    }

    const idx = membership.associated_students.findIndex(
      (id) => id.toString() === studentId,
    );

    if (idx === -1) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'student',
        details: [],
        customMessage: 'Aluno não encontrado neste responsável.',
      });
    }

    membership.associated_students.splice(idx, 1);

    const atualizado = await this.repository.update(pai._id, {
      memberships: pai.memberships,
    });

    return this._stripSensitiveFields(atualizado);
  }

  async moveStudentToClass(schoolId, parentId, studentId, classId) {
    const pai = await this.repository.getById(parentId);

    const membership = Array.isArray(pai.memberships)
      ? pai.memberships.find(
          (m) => m.school_id?.toString() === schoolId && m.role === 'parent',
        )
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'membership',
        details: [],
        customMessage: 'Usuário não é responsável nesta escola.',
      });
    }

    const isChild = membership.associated_students.some(
      (id) => id.toString() === studentId,
    );

    if (!isChild) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'student',
        details: [],
        customMessage: 'Aluno não encontrado neste responsável.',
      });
    }

    const aluno = await this.repository.getById(studentId);
    const studentMembership = Array.isArray(aluno.memberships)
      ? aluno.memberships.find(
          (m) => m.school_id?.toString() === schoolId && m.role === 'student',
        )
      : null;

    if (!studentMembership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'student',
        details: [],
        customMessage: 'Matrícula do aluno não encontrada.',
      });
    }

    studentMembership.class_id = classId;
    const atualizado = await this.repository.update(aluno._id, {
      memberships: aluno.memberships,
    });

    return this._stripSensitiveFields(atualizado);
  }

  async deactivateMembership(schoolId, userId) {
    const usuario = await this.repository.getById(userId);
    if (!usuario) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: 'Usuário não encontrado.',
      });
    }

    const membership = Array.isArray(usuario.memberships)
      ? usuario.memberships.find((m) => m.school_id?.toString() === schoolId)
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'membership',
        details: [],
        customMessage: 'Vínculo não encontrado.',
      });
    }

    membership.active = false;
    membership.deactivated_at = new Date();

    if (
      membership.role === 'parent' &&
      membership.associated_students?.length > 0
    ) {
      await Promise.allSettled(
        membership.associated_students.map(async (studentId) => {
          const aluno = await this.repository.getById(studentId.toString());
          if (!aluno) return;
          const studentMembership = Array.isArray(aluno.memberships)
            ? aluno.memberships.find(
                (m) =>
                  m.school_id?.toString() === schoolId && m.role === 'student',
              )
            : null;
          if (studentMembership) {
            studentMembership.class_id = null;
            await this.repository.update(aluno._id, {
              memberships: aluno.memberships,
            });
          }
        }),
      );
    }

    const atualizado = await this.repository.update(usuario._id, {
      memberships: usuario.memberships,
    });

    return this._stripSensitiveFields(atualizado);
  }

  async activateMembership(schoolId, userId) {
    const usuario = await this.repository.getById(userId);
    if (!usuario) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: 'Usuário não encontrado.',
      });
    }

    const membership = Array.isArray(usuario.memberships)
      ? usuario.memberships.find((m) => m.school_id?.toString() === schoolId)
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'membership',
        details: [],
        customMessage: 'Vínculo não encontrado.',
      });
    }

    membership.active = true;
    membership.deactivated_at = null;

    const atualizado = await this.repository.update(usuario._id, {
      memberships: usuario.memberships,
    });

    return this._stripSensitiveFields(atualizado);
  }

  async updateMembershipRole(schoolId, userId, newRole) {
    const usuario = await this.repository.getById(userId);

    const membership = Array.isArray(usuario.memberships)
      ? usuario.memberships.find((m) => m.school_id?.toString() === schoolId)
      : null;

    if (!membership) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'membership',
        details: [],
        customMessage: 'O usuário não possui vínculo com esta escola.',
      });
    }

    if (membership.role === 'admin') {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'role',
        details: [
          { path: 'role', message: 'O role de admin não pode ser alterado.' },
        ],
        customMessage: 'Não é permitido alterar o role de um administrador.',
      });
    }

    if (newRole === 'admin') {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'role',
        details: [
          {
            path: 'role',
            message: 'Não é possível promover um usuário para admin.',
          },
        ],
        customMessage: 'O role admin não pode ser atribuído por este endpoint.',
      });
    }

    membership.role = newRole;

    if (newRole !== 'parent') {
      membership.associated_students = [];
    }
    if (newRole !== 'student') {
      membership.class_id = null;
    }

    const atualizado = await this.repository.update(userId, {
      memberships: usuario.memberships,
    });

    return this._stripSensitiveFields(atualizado);
  }

  async listBySchool(schoolId, query) {
    const data = await this.repository.listBySchool(schoolId, query);
    if (!Array.isArray(data?.docs)) return data;

    const studentIds = [];
    data.docs.forEach((doc) => {
      const m = doc.memberships?.find(
        (m) => m.school_id?.toString() === schoolId && m.role === 'parent',
      );
      if (m?.associated_students?.length > 0) {
        m.associated_students.forEach((id) => studentIds.push(id.toString()));
      }
    });

    const studentMap = {};
    if (studentIds.length > 0) {
      const students = await this.repository.findUsers(studentIds, 'student');
      students.forEach((s) => {
        const sm = s.memberships?.find((m) => m.role === 'student');
        studentMap[s._id.toString()] = {
          _id: s._id,
          full_name: s.full_name,
          class_id: sm?.class_id || null,
        };
      });
    }

    data.docs = data.docs.map((doc) => {
      const stripped = this._stripSensitiveFields(doc);
      if (Array.isArray(stripped.memberships)) {
        stripped.memberships = stripped.memberships.map((m) => {
          if (m.role === 'parent' && Array.isArray(m.associated_students)) {
            return {
              ...m,
              associated_students: m.associated_students
                .map((id) => studentMap[id.toString()] || null)
                .filter(Boolean),
            };
          }
          return m;
        });
      }
      return stripped;
    });

    return data;
  }

  async getById(id, requesterId = null) {
    const user = await this.repository.getById(id);

    if (requesterId && requesterId.toString() !== id.toString()) {
      const requester = await this.repository.getById(requesterId);
      const requesterSchoolIds = new Set(
        (requester?.memberships || []).map((m) => m?.school_id?.toString()),
      );

      const userObj = this._stripSensitiveFields(user);
      userObj.memberships = (userObj.memberships || []).filter((m) =>
        requesterSchoolIds.has(m?.school_id?.toString()),
      );

      return userObj;
    }

    return this._stripSensitiveFields(user);
  }

  async update(id, parsedData) {
    delete parsedData.password;
    delete parsedData.email;
    delete parsedData.groups;
    delete parsedData.permissions;

    await this.ensureUserExists(id);

    const data = await this.repository.update(id, parsedData);
    return data;
  }

  async delete(id) {
    await this.ensureUserExists(id);
    const data = await this.repository.delete(id);
    return data;
  }

  async validateEmail(email, id = null) {
    const existente = await this.repository.getByEmail(email, id);
    if (existente && !id) {
      return existente;
    }
    if (existente && id) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'duplicateEntry',
        field: 'email',
        details: [{ path: 'email', message: 'Email já está em uso.' }],
        customMessage: 'Email já está em uso.',
      });
    }
    return null;
  }

  async ensureUserExists(id) {
    const user = await this.repository.getById(id);
    if (!user) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: messages.error.resourceNotFound('User'),
      });
    }
    return user;
  }

  generateTempPassword() {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let senha = '';
    for (let i = 0; i < 12; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
  }

  async getMe(userId) {
    const user = await this.repository.getById(userId);
    const obj =
      typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
  }

  async updateMe(userId, parsedData) {
    if (parsedData.email) {
      await this.validateEmail(parsedData.email, userId);
    }
    const data = await this.repository.update(userId, parsedData);
    const obj =
      typeof data.toObject === 'function' ? data.toObject() : { ...data };
    delete obj.password;
    return obj;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.repository.getByIdWithPassword(userId);

    const senhaValida = await bcrypt.compare(currentPassword, user.password);
    if (!senhaValida) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNAUTHORIZED.code,
        errorType: 'unauthorized',
        field: 'current_password',
        details: [
          { path: 'current_password', message: 'Senha atual incorreta.' },
        ],
        customMessage: 'Senha atual incorreta.',
      });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    await this.repository.updatePassword(userId, hash);
  }

  async uploadAvatar(userId, file) {
    if (!file) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'badRequest',
        field: 'avatar',
        details: [{ path: 'avatar', message: 'Nenhum arquivo foi enviado.' }],
        customMessage: 'Nenhum arquivo foi enviado.',
      });
    }

    const user = await this.repository.getById(userId);

    if (user.avatar_url) {
      const bucketPrefix = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/`;
      const oldKey = user.avatar_url.startsWith(bucketPrefix)
        ? user.avatar_url.slice(bucketPrefix.length)
        : user.avatar_url.split('/').slice(-2).join('/');
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET, oldKey);
      } catch (_) {}
    }

    const image = await compress(file.buffer);
    const objectName = `avatars/${new mongoose.Types.ObjectId().toString()}.${image[1].format}`;

    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      objectName,
      image[0],
      {
        'Content-Type': file.mimetype,
      },
    );

    const avatarUrl = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${objectName}`;

    const updated = await this.repository.update(userId, {
      avatar_url: avatarUrl,
    });
    const obj =
      typeof updated.toObject === 'function'
        ? updated.toObject()
        : { ...updated };
    delete obj.password;
    return obj;
  }

  async deleteAvatar(userId) {
    const user = await this.repository.getById(userId);

    if (user.avatar_url) {
      const bucketPrefix = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/`;
      const oldKey = user.avatar_url.startsWith(bucketPrefix)
        ? user.avatar_url.slice(bucketPrefix.length)
        : user.avatar_url.split('/').slice(-2).join('/');
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET, oldKey);
      } catch (_) {}
    }

    const updated = await this.repository.update(userId, { avatar_url: null });
    const obj =
      typeof updated.toObject === 'function'
        ? updated.toObject()
        : { ...updated };
    delete obj.password;
    return obj;
  }
}

export default UserService;
