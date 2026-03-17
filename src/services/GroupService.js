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
    this.userRepository = new UserRepository();
    this.routeRepository = new RouteRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);
    return data;
  }

  async create(parsedData) {
    const group = await this.repository.getByName(parsedData.nome);
    if (group) {
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
    const group = await this.repository.getByName(parsedData.nome, id);
    await this.checkGroup(user, id);
    if (group) {
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
    await this.userRepository.getById(user.id);
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
    const userDoc = await this.userRepository.getById(user.id);
    const userGroup = userDoc.toObject();
    for (const group of userGroup.groups) {
      if (group._id.toString() === id) {
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
  async addRoute(groupId, routeId) {
    const group = await this.repository.getById(groupId);
    if (!group) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'Grupos',
        details: [],
        customMessage: messages.error.resourceNotFound('Grupos'),
      });
    }

    const route = await this.routeRepository.getById(routeId);

    if (!route) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorType: 'resourceNotFound',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.resourceNotFound('Rotas'),
      });
    }
    const existingRoute = group.permissions.find(
      (item) => item.route === route.route,
    );
    if (existingRoute) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorType: 'resourceConflict',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Grupos',
          'rotas duplicadas',
        ),
      });
    }
    const data = await this.repository.addRoute(groupId, route);

    return data;
  }
}

export default GroupService;
