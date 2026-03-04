import UsuarioFilterBuilder from './filters/UsuarioFilterBuilder.js';
import UsuarioModel from '../models/Usuario.js';
import { CustomError, messages } from '../utils/helpers/index.js';

class UsuarioRepository {
  constructor({ usuarioModel = UsuarioModel } = {}) {
    this.model = usuarioModel;
  }

  async criar(dadosUsuario) {
    const usuario = new this.model(dadosUsuario);
    return await usuario.save();
  }

  async listar(req) {
    const id = req.params.id || null;

    // Se um ID for fornecido, retorna o usuário enriquecido com estatísticas.
    if (id) {
      const data = await this.model.findById(id);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Usuário',
          details: [],
          customMessage: messages.error.resourceNotFound('Usuário'),
        });
      }

      const dataWithStats = {
        ...data.toObject(),
      };

      return dataWithStats;
    }

    const { full_name, email, active, page = 1 } = req.query;
    const limite = Math.min(parseInt(req.query.limite, 10) || 10, 100);

    const filterBuilder = new UsuarioFilterBuilder()
      .comNome(full_name || '')
      .comEmail(email || '')
      .comAtivo(active || '');

    if (typeof filterBuilder.build !== 'function') {
      throw new CustomError({
        statusCode: 500,
        errorType: 'internalServerError',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.internalServerError('Usuário'),
      });
    }

    const filtros = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limite, 10),
      sort: { full_name: 1 },
    };

    const resultado = await this.model.paginate(filtros, options);

    // Enriquecer cada usuário com estatísticas utilizando o length dos arrays.
    resultado.docs = resultado.docs.map((doc) => {
      const usuarioObj =
        typeof doc.toObject === 'function' ? doc.toObject() : doc;

      return {
        ...usuarioObj,
      };
    });

    return resultado;
  }

  async atualizar(id, parsedData) {
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

  async deletar(id) {
    const usuario = await this.model.findByIdAndDelete(id);
    return usuario;
  }

  // Métodos auxiliares.

  async buscarPorEmail(email, idIgnorado = null) {
    const filtro = { email };

    if (idIgnorado) {
      filtro._id = { $ne: idIgnorado };
    }

    const documento = await this.model.findOne(filtro, '+password');

    return documento;
  }

  async buscarPorId(id, includeTokens = false) {
    let query = this.model.findById(id);

    if (includeTokens) {
      query = query.select('+refresh_token +access_token');
    }

    const user = await query;

    if (!user) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.resourceNotFound('Usuário'),
      });
    }

    return user;
  }

  async armazenarTokens(id, accesstoken, refreshtoken) {
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

  async buscarPorCodigoRecuperacao(codigo) {
    return await this.model.findOne({ password_recovery_code: codigo });
  }

  async buscarPorTokenConvite(token) {
    return await this.model
      .findOne({ invite_token: token })
      .select('+invite_token +invited_at');
  }

  async atualizarSenha(id, senhaHash) {
    const usuario = await this.model.findByIdAndUpdate(
      id,
      {
        password: senhaHash,
        unique_token: null,
        password_recovery_code: null,
        password_recovery_code_exp: null,
      },
      { new: true },
    );

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

  async buscarPorTokenUnico(token) {
    return await this.model
      .findOne({ unique_token: token })
      .select('+unique_token');
  }

  async removeToken(id) {
    const usuarioExistente = await this.model.findById(id);
    if (!usuarioExistente) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Usuário',
        details: [],
        customMessage: messages.error.resourceNotFound('Usuário'),
      });
    }

    usuarioExistente.access_token = null;
    usuarioExistente.refresh_token = null;

    await usuarioExistente.save();
    return usuarioExistente;
  }
}

export default UsuarioRepository;
