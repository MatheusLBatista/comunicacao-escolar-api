import { ZodError } from 'zod';
import logger from '../logger.js';
import CommonResponse from './CommonResponse.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import AuthenticationError from '../errors/AuthenticationError.js';
import TokenExpiredError from '../errors/TokenExpiredError.js';
import CustomError from './CustomError.js';
import { MulterError } from 'multer';

/**
 * Middleware para tratamento centralizado de erros.
 * Identifica o tipo de erro e envia uma resposta padronizada ao cliente.
 *
 * @param {Error} err - Erro lançado durante a execução.
 * @param {object} req - Objeto de requisição do Express.
 * @param {object} res - Objeto de resposta do Express.
 * @param {function} next - Função para repassar o controle para o próximo middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Verifica se o ambiente é de produção para ajustar a mensagem de erro.
  const isProduction = process.env.NODE_ENV === 'production';
  // Gera um ID único para identificar o erro (útil para logs).
  const errorId = uuidv4();
  const requestId = req.requestId || 'N/A';

  // Tratamento para erros de validação do Zod.
  if (err instanceof ZodError) {
    logger.warn('Erro de validação', {
      errors: err.errors,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      null,
      err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      `Erro de validação. ${err.errors.length} campo(s) inválido(s).`,
    );
  }

  // Tratamento para erro de chave duplicada no MongoDB (código 11000).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue ? err.keyValue[field] : 'duplicado';
    logger.warn('Erro de chave duplicada', {
      field,
      value,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(
      res,
      409,
      'duplicateEntry',
      field,
      [{ path: field, message: `O valor "${value}" já está em uso.` }],
      `Entrada duplicada no campo "${field}".`,
    );
  }

  // Tratamento para erros de validação do Mongoose.
  if (err instanceof mongoose.Error.ValidationError) {
    const detalhes = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    logger.warn('Erro de validação do Mongoose', {
      details: detalhes,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(res, 400, 'validationError', null, detalhes);
  }

  // Tratamento para erros de autenticação customizados (AuthenticationError e TokenExpiredError).
  if (err instanceof AuthenticationError || err instanceof TokenExpiredError) {
    logger.warn('Erro de autenticação', {
      message: err.message,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(
      res,
      err.statusCode,
      'authenticationError',
      null,
      [{ message: err.message }],
      err.message,
    );
  }

  // Tratamento específico para CustomError com errorType 'tokenExpired'.
  if (err instanceof CustomError && err.errorType === 'tokenExpired') {
    logger.warn('Erro de token expirado', {
      message: err.message,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(
      res,
      err.statusCode || 401,
      'tokenExpired',
      null,
      [{ message: err.customMessage || 'Token expirado.' }],
      err.customMessage || 'Token expirado. Por favor, faça login novamente.',
    );
  }

  // Tratamento para erros de upload de arquivo (Multer).
  if (err instanceof MulterError) {
    const multerErrorMessages = {
      'LIMIT_FILE_SIZE': 'Arquivo muito grande',
      'LIMIT_FILE_COUNT': 'Muitos arquivos enviados',
      'FILE_TOO_LARGE': 'Arquivo excede o tamanho máximo',
      'LIMIT_PART_COUNT': 'Muitas partes no formulário',
    };

    const errorMessage = multerErrorMessages[err.code] || err.message;
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

    logger.warn('Erro de upload de arquivo', {
      message: err.message,
      code: err.code,
      path: req.path,
      requestId,
    });

    return CommonResponse.error(
      res,
      statusCode,
      'fileUploadError',
      err.field || 'file',
      [{ path: err.field || 'file', message: errorMessage }],
      `Erro ao fazer upload: ${errorMessage}`,
    );
  }

  if (err.isOperational) {
    logger.warn('Erro operacional', {
      message: err.message,
      path: req.path,
      requestId,
    });
    return CommonResponse.error(
      res,
      err.statusCode,
      err.errorType || 'operationalError',
      err.field || null,
      err.details || [],
      err.customMessage || 'Erro operacional.',
    );
  }

  // Tratamento para erros internos (não operacionais).
  logger.error(`Erro interno [ID: ${errorId}]`, {
    message: err.message,
    stack: err.stack,
    requestId,
  });
  const detalhes = isProduction
    ? [{ message: `Erro interno do servidor. Referência: ${errorId}` }]
    : [{ message: err.message, stack: err.stack }];

  return CommonResponse.error(res, 500, 'serverError', null, detalhes);


};

export default errorHandler;
