import UserService from '../services/UserService.js';
import { CommonResponse, HttpStatusCodes } from '../utils/helpers/index.js';
import {
  MeUpdateSchema,
  ChangePasswordSchema,
} from '../utils/validators/schemas/zod/UserSchema.js';

class MeController {
  constructor() {
    this.service = new UserService();
  }

  async getMe(req, res) {
    const data = await this.service.getMe(req.user_id);
    return CommonResponse.success(res, data);
  }

  async updateMe(req, res) {
    const parsedData = MeUpdateSchema.parse(req.body);
    const data = await this.service.updateMe(req.user_id, parsedData);
    return CommonResponse.success(res, data);
  }

  async changePassword(req, res) {
    const { current_password, new_password } = ChangePasswordSchema.parse(
      req.body,
    );
    await this.service.changePassword(
      req.user_id,
      current_password,
      new_password,
    );
    return CommonResponse.success(
      res,
      null,
      HttpStatusCodes.OK.code,
      'Senha alterada com sucesso.',
    );
  }

  async uploadAvatar(req, res) {
    const data = await this.service.uploadAvatar(req.user_id, req.file);
    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Avatar atualizado com sucesso.',
    );
  }

  async deleteAvatar(req, res) {
    const data = await this.service.deleteAvatar(req.user_id);
    return CommonResponse.success(
      res,
      data,
      HttpStatusCodes.OK.code,
      'Avatar removido com sucesso.',
    );
  }
}

export default MeController;
