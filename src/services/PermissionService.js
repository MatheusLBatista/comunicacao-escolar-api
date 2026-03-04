import Usuario from '../models/User.js';
import Grupo from '../models/Group.js';
import Rota from '../models/Route.js';
import UserRepository from '../repositories/UserRepository.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class PermissionService {
  constructor() {
    this.repository = new UserRepository();
    this.Usuario = Usuario;
    this.Grupo = Grupo;
    this.Rota = Rota;
    this.messages = messages;
  }

  async hasPermission(
    userId,
    route,
    domain,
    method,
    params = {},
    httpMethod = '',
  ) {
    try {
      const usuario = await this.repository.getById(userId, {
        groups: true,
      });
      if (!usuario) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Usuário',
          details: [],
          customMessage: messages.error.resourceNotFound('Usuário'),
        });
      }

      if (route === 'usuarios' && params.id && params.id === userId) {
        const metodosPermitidos = ['GET', 'PATCH', 'PUT', 'DELETE'];
        if (metodosPermitidos.includes(httpMethod)) {
          return true;
        }
      }

      let permissions = usuario.permissions || [];

      if (Array.isArray(usuario.groups)) {
        for (const grupo of usuario.groups) {
          permissions = permissions.concat(grupo.permissions || []);
        }
      }

      const uniquePermissions = [];
      const combinations = new Set();

      permissions.forEach((permission) => {
        const key = `${permission.route}_${permission.domain}`;
        if (!combinations.has(key)) {
          combinations.add(key);
          uniquePermissions.push(permission);
        }
      });

      const hasPermission = uniquePermissions.some((permission) => {
        return (
          permission.route === route &&
          permission.domain === domain &&
          permission.active &&
          permission[method]
        );
      });

      return hasPermission;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }
}

export default PermissionService;
