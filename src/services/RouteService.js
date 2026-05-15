import RouteRepository from '../repositories/RouteRepository.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../utils/helpers/index.js';

class RouteService {
  constructor() {
    this.repository = new RouteRepository();
  }

  async list(req) {
    const data = await this.repository.list(req);
    return data;
  }

  async create(req) {
    console.log('Estou no criar em RotaService');
    const rota = await this.repository.getRouteByName(req.route);
    if (rota) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorTypes: 'resourceConflict',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Rotas',
          'rotas duplicadas',
        ),
      });
    }
    const data = await this.repository.create(req);
    return data;
  }

  async update(req, id) {
    const rota = await this.repository.getRouteByName(req.route, id);
    if (rota) {
      throw new CustomError({
        statusCode: HttpStatusCodes.CONFLICT.code,
        errorTypes: 'resourceConflict',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.resourceConflict(
          'Rotas',
          'rotas duplicadas',
        ),
      });
    }
    const data = await this.repository.update(req, id);
    return data;
  }

  async delete(req, id) {
    const rota = await this.repository.getById(id);
    if (!rota) {
      throw new CustomError({
        statusCode: HttpStatusCodes.NOT_FOUND.code,
        errorTypes: 'resourceNotFound',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.resourceNotFound('Rota'),
      });
    }
    const rotaAtual = req.route.path.replace(/\//g, '');
    if (rotaAtual === rota.route || rotaAtual.includes(rota.route)) {
      throw new CustomError({
        statusCode: HttpStatusCodes.FORBIDDEN.code,
        errorTypes: 'resourceNotFound',
        field: 'Rotas',
        details: [],
        customMessage: messages.error.forbidden(
          'Não pode deletar a rota atual',
        ),
      });
    }
    const data = await this.repository.delete(id);
    return data;
  }
}
export default RouteService;
