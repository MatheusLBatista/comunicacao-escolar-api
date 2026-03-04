import GroupService from '../services/GroupService.js';
import {
  CommonResponse,
  CustomError,
  HttpStatusCodes,
} from '../utils/helpers/index.js';
import {
  GroupQuerySchema,
  GroupIdSchema,
} from '../utils/validators/schemas/zod/querys/GroupQuerySchema.js';
import {
  GroupSchema,
  GroupUpdateSchema,
} from '../utils/validators/schemas/zod/GroupSchema.js';
import ObjectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

class GroupController {
  constructor() {
    this.service = new GroupService();
  }

  /**
   * Validação nesta aplicação segue o segue este artigo:
   * https://docs.google.com/document/d/1m2Ns1rIxpUzG5kRsgkbaQFdm7od0e7HSHfaSrrwegmM/edit?usp=sharing
   */

  /**
   * Lista grupos. Se um ID é fornecido, retorna um único objeto.
   * Caso contrário, retorna todos os objetos com suporte a filtros e paginação.
   */

  async list(req, res) {
    console.log(
      'Estou no listar em GrupoController, enviando  req para GrupoService',
    );

    //1ª Validação estrutural - validação do ID passado por parâmetro
    const { id } = req.params || null;

    console.log('ID recebido:', id);
    if (id) {
      GroupIdSchema.parse(id); // Lança erro automaticamente se inválido
    }

    // 2º Validação estrutural - validar os demais campos passados por query
    const query = req.query || {};
    if (Object.keys(query).length !== 0) {
      const validatedQuery = GroupQuerySchema.parse(req.query);
    }

    // Chama o serviço para listar os grupos
    const data = await this.service.list(req);

    console.log('Estou retornando os dados em GrupoController');
    return CommonResponse.success(res, data);
  }

  /**
   * Criar um novo grupo.
   */
  async create(req, res) {
    console.log('Estou no criar em GrupoController');

    // Validação dos dados de entrada usando Zod (estrutural)
    const parsedData = GroupSchema.parse(req.body);

    const data = await this.service.create(parsedData);

    // Se chegou até aqui, é porque deu tudo certo, retornar 201 Created
    return CommonResponse.created(res, data);
  }

  /**
   * Atualiza um grupo existente.
   */
  async update(req, res) {
    console.log('Estou no atualizar em GrupoController');

    //1ª Validação estrutural - validação do ID passado por parâmetro
    const { id } = req.params || null;
    if (id) {
      GroupIdSchema.parse(id); // Lança erro automaticamente se inválido
    }

    // Validação dos dados de entrada usando Zod (estrutural)
    const parsedData = GroupUpdateSchema.parse(req.body);

    // Chama o serviço para atualizar o grupo
    const data = await this.service.update(parsedData, id, req.user);

    // Se chegou até aqui, é porque deu tudo certo, retornar 200 OK
    return CommonResponse.success(res, data);
  }

  /**
   * Deleta um grupo existente.
   */
  async delete(req, res) {
    console.log('Estou no deletar em GrupoController');

    // Validação estrutural - validação do ID passado por parâmetro
    const { id } = req.params || null;
    GroupIdSchema.parse(id);
    if (!id) {
      throw new CustomError(
        'ID do grupo é obrigatório para deletar.',
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    // Chama o serviço para deletar o grupo
    const data = await this.service.delete(id, req.user);

    // Se chegou até aqui, é porque deu tudo certo, retornar 200 OK
    return CommonResponse.success(
      res,
      data,
      200,
      'Grupo excluído com sucesso.',
    );
  }

  async addRoute(req, res) {
    console.log('Estou no adicionarRota em GrupoController');

    const { id } = req.params;
    const { idRota } = req.body;
    GroupIdSchema.parse(id);
    ObjectIdSchema.parse(idRota);

    const data = await this.service.addRoute(id, idRota);
    return CommonResponse.success(
      res,
      data,
      200,
      'Rota Adicionada com sucesso.',
    );
  }
}

export default GroupController;
