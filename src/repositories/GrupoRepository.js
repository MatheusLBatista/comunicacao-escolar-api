// src/repositories/GrupoRepository.js

import GrupoModel from '../models/Grupo.js';
import UsuarioModel from '../models/Usuario.js';
import RotaModel from '../models/Rota.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import GrupoFilterBuilder from './filters/GrupoFilterBuilder.js';

class GrupoRepository {
  constructor({
    grupoModel = GrupoModel,
    rotaModel = RotaModel,
    usuarioModel = UsuarioModel,
    customError = CustomError,
  } = {}) {
    this.model = grupoModel;
    this.rotaModel = rotaModel;
    this.usuarioModel = usuarioModel;
    this.customError = customError;
  }

  /**
   * Verificar se há permissões duplicadas na requisição.
   */
  async obterParesRotaDominioUnicos(permissions) {
    const combinations = permissions.map(
      (p) => `${p.route}_${p.domain || 'undefined'}`,
    );
    const uniqueCombinations = [...new Set(combinations)];
    return uniqueCombinations.map((combination) => {
      const [route, domain] = combination.split('_');
      return { route, domain: domain === 'undefined' ? null : domain };
    });
  }

  /**
   * Obter permissões duplicadas na requisição.
   */
  obterPermissoesDuplicadas(permissions, combinationsReceived) {
    const combinations = permissions.map(
      (permission) => `${permission.route}_${permission.domain}`,
    );
    const counts = {};
    combinations.forEach((combination) => {
      counts[combination] = (counts[combination] || 0) + 1;
    });
    const duplicates = Object.keys(counts).filter(
      (combination) => counts[combination] > 1,
    );
    const uniqueDuplicates = [];
    const seen = new Set();
    permissions.forEach((permission) => {
      const combination = `${permission.route}_${permission.domain}`;
      if (duplicates.includes(combination) && !seen.has(combination)) {
        seen.add(combination);
        uniqueDuplicates.push(permission);
      }
    });
    return uniqueDuplicates;
  }

  /**
   * Buscar grupo por nome e, opcionalmente, por um ID diferente.
   */
  async buscarPorNome(nome, idIgnorado = null) {
    // Criar o filtro base
    const filtro = { nome };

    // Adicionar a condição para excluir o ID, se fornecido
    if (idIgnorado) {
      filtro._id = { $ne: idIgnorado }; // Adiciona a condição _id != idIgnorado
    }

    // Consultar o documento no banco de dados
    const documento = await this.model.findOne(filtro);

    // Retornar o documento encontrado
    return documento;
  }

  /**
   * Método buscar por ID - Deve ser chamado por controllers ou services.
   * para retornar um usuário e ser utilizado em outras funções de validação
   * cujo listar não atende por exigir req.
   */
  async buscarPorId(id) {
    const group = await this.model.findById(id);
    if (!group) {
      throw new this.customError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.resourceNotFound('Grupo'),
      });
    }
    return group;
  }

  /** Método buscar por permissão
   * para saber se a permissão existe no cadastrado de rotas e domínios
   * O método deve buscar combinando rota e domínio
   */
  async buscarPorPermissao(permissions) {
    // find recursivo lendo um array de objetos de permissão,
    // Mapear as permissões para combinar route e domain
    const query = permissions.map((p) => ({
      route: p.route,
      domain: p.domain || null,
    }));

    const rotasEncontradas = await this.rotaModel.find({ $or: query });
    return rotasEncontradas;
  }

  /**
   * Método listar grupo tanto com filtro quanto sem filtro ou por ID, caso seja passado
   */
  async listar(req) {
    try {
      const id = req.params.id || null;

      if (id) {
        const data = await this.model.findById(id).populate('permissions');

        if (!data) {
          throw new this.customError({
            statusCode: 404,
            errorType: 'resourceNotFound',
            field: 'Grupo',
            details: [],
            customMessage: messages.error.resourceNotFound('Grupo'),
          });
        }

        // Utilizando o length dos arrays
        const totalPermissoes = data.permissions ? data.permissions.length : 0;

        const dataWithStats = {
          ...data.toObject(),
          estatisticas: {
            totalPermissoes,
          },
        };

        return data;
      }

      // Extrair os filtros da query
      const { nome, descricao, ativo = 'true', page = 1 } = req.query;

      // Garantir que o limite não ultrapasse 100
      const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

      // Usar o GrupoFilterBuilder injetado para construir os filtros
      const filterBuilder = new GrupoFilterBuilder()
        .comNome(nome || '')
        .comDescricao(descricao || '')
        .comAtivo(ativo || '');

      // Agora sim construir os filtros
      const filtros = filterBuilder.build();
      console.log('Filtros construídos:', filtros);

      // Configurar a paginação
      const options = {
        page: parseInt(page),
        limit: parseInt(limite),
        populate: ['permissions'],
        sort: { nome: 1 },
      };

      const resultado = await this.model.paginate(filtros, options);
      console.log('Resultado da paginação:', resultado);

      // Enriquecer cada usuário com estatísticas utilizando o length dos arrays
      resultado.docs = resultado.docs.map((doc) => {
        const grupoObj =
          typeof doc.toObject === 'function' ? doc.toObject() : doc;

        const totalPermissoes = grupoObj.permissions
          ? grupoObj.permissions.length
          : 0;

        return {
          ...grupoObj,
          estatisticas: {
            totalPermissoes,
          },
        };
      });

      return resultado;
    } catch (error) {
      console.error('Erro ao listar grupos:', error);
      // Verificar se o erro já possui uma propriedade 'statusCode'
      if (error.statusCode) {
        throw error;
      }
      // Caso contrário, lançar um erro interno do servidor
      throw new this.customError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.internalServerError('Grupo'),
      });
    }
  }

  /**
   * Verificar se há usuários associados ao grupo.
   * @param {String} id - ID do grupo.
   * @returns {Boolean} - true se houver usuários associados, false caso contrário.
   */
  async verificarUsuariosAssociados(id) {
    try {
      const usuariosAssociados = await this.usuarioModel.findOne({
        groups: id,
      });
      return usuariosAssociados; // Retorna true se houver usuários, false caso contrário
    } catch (error) {
      console.error('Erro ao verificar usuários associados:', error);
      throw new this.customError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.internalServerError('Grupo'),
      });
    }
  }

  // Método criar grupo
  async criar(parsedData) {
    const grupo = new this.model(parsedData);
    return await grupo.save();
  }

  // Método atualizar grupo
  async atualizar(id, parsedData) {
    try {
      const grupo = await this.model.findByIdAndUpdate(id, parsedData, {
        new: true,
      });

      if (!grupo) {
        throw new this.customError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Grupo',
          details: [],
          customMessage: messages.error.resourceNotFound('Grupo'),
        });
      }
      return grupo;
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      // Verificar se o erro já possui uma propriedade 'statusCode'
      if (error.statusCode) {
        throw error;
      }
      // Caso contrário, lançar um erro interno do servidor
      throw new this.customError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.internalServerError('Grupo'),
      });
    }
  }

  /**
   * Método deletar grupo.
   */
  async deletar(id) {
    try {
      const grupoDeletado = await this.model.findByIdAndDelete(id);

      if (!grupoDeletado) {
        throw new this.customError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Grupo',
          details: [],
          customMessage: messages.error.resourceNotFound('Grupo'),
        });
      }
      return grupoDeletado;
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      // Verificar se o erro já possui uma propriedade 'statusCode'
      if (error.statusCode) {
        throw error;
      }
      // Caso contrário, lançar um erro interno do servidor
      throw new this.customError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.internalServerError('Grupo'),
      });
    }
  }
  async adiciotarRota(id, rota) {
    try {
      const grupo = await this.model.findById(id);
      grupo.permissions.push(rota);
      const data = await grupo.save();
      console.log('aqui');
      return data;
    } catch (error) {
      console.error('Erro ao adicionar rota:', error);
      // Verificar se o erro já possui uma propriedade 'statusCode'
      if (error.statusCode) {
        throw error;
      }
      // Caso contrário, lançar um erro interno do servidor
      throw new this.customError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Grupo',
        details: [],
        customMessage: messages.error.internalServerError('Grupo'),
      });
    }
  }
}

export default GrupoRepository;
