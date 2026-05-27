import UserService from '../services/UserService.js';
import AuditLogService from '../services/AuditLogService.js';
import {
  UserQuerySchema,
  UserIdSchema,
} from '../utils/validators/schemas/zod/querys/UserQuerySchema.js';
import {
  UserSchema,
  AdminCreateSchema,
  UserUpdateSchema,
  LinkToSchoolSchema,
  StudentInputSchema,
  UpdateMembershipRoleSchema,
  MoveStudentClassSchema,
} from '../utils/validators/schemas/zod/UserSchema.js';
import ObjectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import { CommonResponse } from '../utils/helpers/index.js';

class UserController {
  constructor() {
    this.service = new UserService();
    this.auditLogService = new AuditLogService();
  }

  async createAdmin(req, res) {
    const parsedData = AdminCreateSchema.parse(req.body);
    const data = await this.service.createAdmin(parsedData);

    const userLimpo = data.toObject
      ? data.toObject()
      : { ...(data._doc || data) };
    delete userLimpo.password;

    return CommonResponse.created(res, userLimpo);
  }

  async createAtSchool(req, res) {
    const { schoolId } = req.params;
    ObjectIdSchema.parse(schoolId);

    const parsedData = UserSchema.parse(req.body);
    const data = await this.service.createAtSchool(schoolId, parsedData);

    this.auditLogService.logAsync(req, {
      schoolId,
      resourceType: 'user',
      resourceId: data._id,
      resourceSummary: `Usuário criado: ${data.full_name || data.email || ''}`,
      action: 'create',
    });

    const userLimpo = data.toObject
      ? data.toObject()
      : { ...(data._doc || data) };
    delete userLimpo.password;

    return CommonResponse.created(res, userLimpo);
  }

  async linkToSchool(req, res) {
    const { schoolId } = req.params;
    ObjectIdSchema.parse(schoolId);

    const parsedData = LinkToSchoolSchema.parse(req.body);
    const data = await this.service.linkToSchool(schoolId, parsedData);

    this.auditLogService.logAsync(req, {
      schoolId,
      resourceType: 'user',
      resourceId: data._id,
      resourceSummary: `Usuário vinculado: ${data.full_name || data.email || ''}`,
      action: 'create',
    });

    const userLimpo = data.toObject
      ? data.toObject()
      : { ...(data._doc || data) };
    delete userLimpo.password;

    return CommonResponse.created(res, userLimpo);
  }

  async addStudentToParent(req, res) {
    const { schoolId, userId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);

    const parsedData = StudentInputSchema.parse(req.body);
    const data = await this.service.addStudentToParent(
      schoolId,
      userId,
      parsedData,
    );

    const userLimpo = data.toObject
      ? data.toObject()
      : { ...(data._doc || data) };
    delete userLimpo.password;

    return CommonResponse.created(res, userLimpo);
  }

  async removeStudentFromParent(req, res) {
    const { schoolId, userId, studentId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);
    ObjectIdSchema.parse(studentId);

    const data = await this.service.removeStudentFromParent(
      schoolId,
      userId,
      studentId,
    );
    return CommonResponse.success(res, data);
  }

  async moveStudentToClass(req, res) {
    const { schoolId, userId, studentId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);
    ObjectIdSchema.parse(studentId);

    const { class_id } = MoveStudentClassSchema.parse(req.body);
    const data = await this.service.moveStudentToClass(
      schoolId,
      userId,
      studentId,
      class_id,
    );
    return CommonResponse.success(res, data);
  }

  async updateMembershipRole(req, res) {
    const { schoolId, userId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);

    const { role } = UpdateMembershipRoleSchema.parse(req.body);
    const data = await this.service.updateMembershipRole(
      schoolId,
      userId,
      role,
    );
    return CommonResponse.success(res, data);
  }

  async deactivateMembership(req, res) {
    const { schoolId, userId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);
    const data = await this.service.deactivateMembership(schoolId, userId);

    this.auditLogService.logAsync(req, {
      schoolId,
      resourceType: 'user',
      resourceId: userId,
      resourceSummary: `Usuário desvinculado: ${data?.full_name || userId}`,
      action: 'delete',
    });

    return CommonResponse.success(res, data);
  }

  async activateMembership(req, res) {
    const { schoolId, userId } = req.params;
    ObjectIdSchema.parse(schoolId);
    ObjectIdSchema.parse(userId);
    const data = await this.service.activateMembership(schoolId, userId);
    return CommonResponse.success(res, data);
  }

  async listBySchool(req, res) {
    const { schoolId } = req.params;
    ObjectIdSchema.parse(schoolId);

    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      UserQuerySchema.parse(query);
    }

    const data = await this.service.listBySchool(schoolId, query);
    return CommonResponse.success(res, data);
  }

  async getById(req, res) {
    const { id } = req.params;
    UserIdSchema.parse(id);

    const data = await this.service.getById(id, req.user_id);
    return CommonResponse.success(res, data);
  }

  async update(req, res) {
    const { id } = req.params;
    UserIdSchema.parse(id);

    const parsedData = UserUpdateSchema.parse(req.body);
    const data = await this.service.update(id, parsedData);

    return CommonResponse.success(res, data);
  }

  async delete(req, res) {
    const { id } = req.params;
    UserIdSchema.parse(id);

    const data = await this.service.delete(id);
    return CommonResponse.success(
      res,
      data,
      200,
      'Usuário desativado com sucesso.',
    );
  }
}

export default UserController;
