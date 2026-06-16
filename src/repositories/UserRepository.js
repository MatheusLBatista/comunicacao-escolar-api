import UserFilterBuilder from './filters/UserFilterBuilder.js';
import UserModel from '../models/User.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import ClassModel from '../models/Class.js';
class UserRepository {
  constructor({ userModel = UserModel } = {}) {
    this.model = userModel;
    this.class = ClassModel;
  }

  async create(data) {
    const user = new this.model(data);
    return await user.save();
  }

  async listBySchool(schoolId, query = {}) {
    const {
      full_name,
      email,
      role,
      active,
      page = 1,
      limit = 10,
      class_id,
    } = query;

    const filterBuilder = new UserFilterBuilder()
      .withName(full_name || '')
      .withEmail(email || '')
      .withActive(active);

    if (class_id) {
      filterBuilder.withClassId(class_id, schoolId);
    } else {
      filterBuilder.withRole(role || '', schoolId);
    }

    const filtros = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 10, 100),
      sort: { full_name: 1 },
    };

    const resultado = await this.model.paginate(filtros, options);

    resultado.docs = resultado.docs.map((doc) => {
      const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
      return obj;
    });

    return resultado;
  }

  async getById(id, includeTokens = false) {
    let query = this.model.findById(id);

    if (includeTokens) {
      query = query.select('+refresh_token +access_token');
    }

    const user = await query;

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

  async update(id, parsedData) {
    const user = await this.model
      .findByIdAndUpdate(id, parsedData, { new: true })
      .lean();

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

  async delete(id) {
    const user = await this.model.findByIdAndUpdate(
      id,
      { active: false },
      { new: true },
    );

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

  async getByGoogleId(googleId) {
    return await this.model
      .findOne({ google_id: googleId })
      .select('+google_id');
  }

  async getByEmail(email, idIgnorado = null) {
    const filtro = { email };

    if (idIgnorado) {
      filtro._id = { $ne: idIgnorado };
    }

    const documento = await this.model.findOne(filtro, '+password');
    return documento;
  }

  async storeTokens(id, accessToken, refreshToken) {
    const documento = await this.model.findById(id);
    if (!documento) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: messages.error.resourceNotFound('User'),
      });
    }

    documento.access_token = accessToken;
    documento.refresh_token = refreshToken;

    const data = await documento.save();
    return data;
  }

  async getByRecoveryCode(codigo) {
    return await this.model.findOne({ password_recovery_code: codigo });
  }

  async getByInviteToken(token) {
    return await this.model
      .findOne({ invite_token: token })
      .select('+invite_token +invited_at');
  }

  async updatePassword(id, senhaHash) {
    const user = await this.model.findByIdAndUpdate(
      id,
      {
        password: senhaHash,
        unique_token: null,
        password_recovery_code: null,
        password_recovery_code_exp: null,
      },
      { new: true },
    );

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

  async getByUniqueToken(token) {
    return await this.model
      .findOne({ unique_token: token })
      .select('+unique_token');
  }

  async deleteToken(id) {
    const user = await this.model.findById(id);
    if (!user) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'User',
        details: [],
        customMessage: messages.error.resourceNotFound('User'),
      });
    }

    user.access_token = null;
    user.refresh_token = null;

    await user.save();
    return user;
  }

  async getByIdWithPassword(id) {
    const user = await this.model.findById(id).select('+password');

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

  async addFcmToken(userId, fcmToken) {
    const user = await this.model.findByIdAndUpdate(
      userId,
      { $addToSet: { fcm_tokens: fcmToken } },
      { new: true },
    );

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

  async listByClass(class_id) {
    const classDoc = await this.class.findById(class_id);
    if (!classDoc) return [];

    const students = await this.model.find({
      memberships: {
        $elemMatch: {
          class_id: class_id,
          role: 'student',
        },
      },
    });

    const studentIds = students.map((student) => student._id);

    const parents = await this.model.find({
      memberships: {
        $elemMatch: {
          role: 'parent',
          associated_students: { $in: studentIds },
        },
      },
    });

    const teacherIds = classDoc.teacher_ids || [];

    const teachers = await this.model.find({
      _id: { $in: teacherIds },
    });

    const schoolId = classDoc.school_id;
    const admins = await this.model.find({
      memberships: {
        $elemMatch: {
          school_id: schoolId,
          role: 'admin',
          active: { $ne: false },
        },
      },
    });

    return [...parents, ...teachers, ...admins];
  }

  async findStudentIdsByTeacherId(teacherId, schoolId = null) {
    const classFilter = { teacher_ids: teacherId };
    if (schoolId) classFilter.school_id = schoolId;

    const classes = await this.class.find(classFilter, { _id: 1 }).lean();
    const classIds = classes.map((c) => c._id);

    if (classIds.length === 0) return [];

    const students = await this.model.find(
      {
        memberships: {
          $elemMatch: {
            class_id: { $in: classIds },
            role: 'student',
            active: { $ne: false },
          },
        },
      },
      { _id: 1 },
    ).lean();

    return students.map((s) => s._id.toString());
  }

  async findUsers(ids, role) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const data = await this.model.find({
      _id: { $in: ids },
      memberships: {
        $elemMatch: {
          role: role,
          active: { $ne: false },
        },
      },
    });

    return data;
  }
}

export default UserRepository;
