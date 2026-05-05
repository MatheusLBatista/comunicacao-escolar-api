import bcrypt from 'bcrypt';
import UserRepository from '../repositories/UserRepository.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../utils/helpers/index.js';

class UserService {
  constructor() {
    this.repository = new UserRepository();
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

    const data = await this.repository.create(userData);
    return data;
  }

  async linkToSchool(schoolId, parsedData) {
    // Localiza o usuário por user_id ou email
    let usuario;
    if (parsedData.user_id) {
      usuario = await this.repository.getById(parsedData.user_id);
    } else {
      usuario = await this.repository.getByEmail(parsedData.email);
    }

    if (!usuario) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: 'Usuário não encontrado.',
      });
    }

    // Verifica se já é membro desta escola
    const jaMembro = Array.isArray(usuario.memberships) &&
      usuario.memberships.some((m) => m.school_id?.toString() === schoolId);
    if (jaMembro) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'duplicateEntry',
        field: 'school_id',
        details: [{ path: 'school_id', message: 'Usuário já vinculado a esta escola.' }],
        customMessage: 'Usuário já vinculado a esta escola.',
      });
    }

    let studentId = null;

    if (parsedData.role === 'parent') {
      // Cria o aluno vinculado a esta escola
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
      ...(parsedData.role === 'parent' && { associated_students: [studentId] }),
    };

    const membershipsAtualizadas = [...(usuario.memberships || []), membership];
    const atualizado = await this.repository.update(usuario._id, {
      memberships: membershipsAtualizadas,
    });

    return atualizado;
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
        customMessage:
          'Usuário não é responsável nesta escola.',
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
    const obj = typeof userObj.toObject === 'function' ? userObj.toObject() : { ...userObj };
    delete obj.fcm_tokens;
    delete obj.permissions;
    delete obj.groups;
    return obj;
  }

  async updateMembershipRole(schoolId, userId, newRole) {
    const usuario = await this.repository.getById(userId);

    const membership = Array.isArray(usuario.memberships)
      ? usuario.memberships.find(
          (m) => m.school_id?.toString() === schoolId,
        )
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
        details: [{ path: 'role', message: 'O role de admin não pode ser alterado.' }],
        customMessage: 'Não é permitido alterar o role de um administrador.',
      });
    }

    if (newRole === 'admin') {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorType: 'forbidden',
        field: 'role',
        details: [{ path: 'role', message: 'Não é possível promover um usuário para admin.' }],
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
    if (Array.isArray(data?.docs)) {
      data.docs = data.docs.map((doc) => this._stripSensitiveFields(doc));
    }
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
    const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
  }

  async updateMe(userId, parsedData) {
    if (parsedData.email) {
      await this.validateEmail(parsedData.email, userId);
    }
    const data = await this.repository.update(userId, parsedData);
    const obj = typeof data.toObject === 'function' ? data.toObject() : { ...data };
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
        details: [{ path: 'current_password', message: 'Senha atual incorreta.' }],
        customMessage: 'Senha atual incorreta.',
      });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    await this.repository.updatePassword(userId, hash);
  }
}

export default UserService;
