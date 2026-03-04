import GroupRepository from '../repositories/GroupRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import RouteRepository from '../repositories/RouteRepository.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../utils/helpers/index.js';

class GroupService {
  constructor() {
    this.repository = new GroupRepository();
    this.usuarioRepository = new UserRepository();
    this.rotaRepository = new RouteRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);
    return data;
  }

  async create(parsedData) {
    const grupo = await this.repository.getByName(parsedData.nome);
    if (grupo) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'resourceConflict',
        field: 'Grupos',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Grupos',
          'nome duplicado',
        ),
      });
    }
    const data = this.repository.create(parsedData);
    return data;
  }

  async update(parsedData, id, user) {
    await this.repository.getById(id);
    const grupo = await this.repository.getByName(parsedData.nome, id);
    await this.checkGroup(user, id);
    if (grupo) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'resourceConflict',
        field: 'Grupos',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Grupos',
          'nome duplicado',
        ),
      });
    }
    const usuario = await this.usuarioRepository.getById(user.id);
    const grupoUsuario = usuario.toObject();
    const data = await this.repository.update(id, parsedData);
    return data;
  }
  async delete(id, user) {
    await this.repository.getById(id);
    await this.checkGroup(user, id);
    const data = this.repository.delete(id);
    return data;
  }

  async checkGroup(user, id) {
    const usuario = await this.usuarioRepository.getById(user.id);
    const grupoUsuario = usuario.toObject();
    for (const grupo of grupoUsuario.groups) {
      if (grupo._id.toString() === id) {
        throw new CustomError({
          statusCode: HttpStatusCodes.FORBIDDEN.code,
          errorType: 'Forbidden',
          field: 'Grupos',
          details: [],
          customMessage: 'Este grupo não pode ser alterado ou deletado.',
        });
      }
    }
  }
  async addRoute(idGrupo, idRota) {
    const grupo = await this.repository.getById(idGrupo);
    if (!grupo) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFuond',
        filed: 'Grupos',
        details: [],
        customMessage: messages.error.resourceNotFound('Grupos'),
      });
    }

    const rota = await this.routeRepository.getById(idRota);

    if (!rota) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFuond',
        filed: 'Rotas',
        details: [],
        customMessage: messages.error.resourceNotFound('Rotas'),
      });
    }
    const existRota = grupo.permissions.find((item) => item.route === rota.route);
    if (existRota) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'resourceConflict',
        filed: 'Rotas',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Grupos',
          'rotas duplicadas',
        ),
      });
    }
    const data = await this.repository.adiciotarRota(idGrupo, rota);

    return data;
  }
}

export default GroupService;
