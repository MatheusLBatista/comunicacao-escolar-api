import UsuarioModel from '../models/User.js';
import RouteModel from '../models/Route.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class AuthRepository {
  constructor({ usuarioModel = UsuarioModel, rotaModel = RouteModel } = {}) {
    this.model = usuarioModel;
    this.rotaModel = rotaModel;
  }

  async storeTokens(id, accesstoken, refreshtoken) {
    const documento = await this.model.findById(id);
    if (!documento) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.resourceNotFound('Usuário'),
      });
    }

    documento.access_token = accesstoken;
    documento.refresh_token = refreshtoken;

    const data = await documento.save();
    return data;
  }

  async deleteToken(id) {
    const parsedData = {
      access_token: null,
      refresh_token: null,
    };

    const usuario = await this.model
      .findByIdAndUpdate(id, parsedData, { new: true })
      .lean();
    if (!usuario) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.resourceNotFound('Usuário'),
      });
    }
    return usuario;
  }
}

export default AuthRepository;
