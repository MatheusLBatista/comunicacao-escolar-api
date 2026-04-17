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

  async listBySchool(schoolId, query) {
    const data = await this.repository.listBySchool(schoolId, query);
    return data;
  }

  async getById(id) {
    const user = await this.repository.getById(id);
    return user;
  }

  async update(id, parsedData) {
    delete parsedData.password;
    delete parsedData.email;

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
}

export default UserService;
