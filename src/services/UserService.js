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
