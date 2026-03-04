import mongoose from 'mongoose';
import mongooseSchemaJsonSchema from 'mongoose-schema-jsonschema';
import removeFieldsRecursively from '../../utils/swagger_utils/removeFields.js';
import Usuario from '../../models/Usuario.js';
import { deepCopy, generateExample } from '../utils/schemaGenerate.js';

mongooseSchemaJsonSchema(mongoose);

const usuarioJsonSchema = Usuario.schema.jsonSchema();
delete usuarioJsonSchema.properties.__v;

const usuariosSchemas = {
  UsuarioFiltro: {
    type: 'object',
    properties: {
      full_name: usuarioJsonSchema.properties.full_name,
      email: usuarioJsonSchema.properties.email,
      active: usuarioJsonSchema.properties.active,
    },
  },
  UsuarioListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/UsuarioItem',
        },
      },
      totalDocs: { type: 'number', example: 100 },
      limit: { type: 'number', example: 10 },
      totalPages: { type: 'number', example: 10 },
      page: { type: 'number', example: 1 },
      pagingCounter: { type: 'number', example: 1 },
      hasPrevPage: { type: 'boolean', example: false },
      hasNextPage: { type: 'boolean', example: true },
      prevPage: { type: 'number', nullable: true, example: null },
      nextPage: { type: 'number', example: 2 },
    },
    description: 'Schema para listagem paginada de usuários',
  },
  UsuarioItem: {
    ...deepCopy(usuarioJsonSchema),
    description: 'Schema para item de usuário na listagem',
  },
  UsuarioDetalhes: {
    ...deepCopy(usuarioJsonSchema),
    description: 'Schema para detalhes de um usuário',
  },
  UsuarioPost: {
    ...deepCopy(usuarioJsonSchema),
    required: ['full_name', 'email', 'password'],
    description: 'Schema para criação de usuário',
  },
  UsuarioPutPatch: {
    ...deepCopy(usuarioJsonSchema),
    required: [],
    description: 'Schema para atualização de usuário',
  },
  UsuarioLogin: {
    ...deepCopy(usuarioJsonSchema),
    required: ['email', 'password'],
    description: 'Schema para login de usuário',
  },
  UsuarioRespostaLogin: {
    ...deepCopy(usuarioJsonSchema),
    description: 'Schema para resposta de login de usuário',
  },
  UsuarioUploadFotoResposta: {
    type: 'object',
    properties: {
      error: {
        type: 'boolean',
        example: false,
      },
      code: {
        type: 'number',
        example: 201,
      },
      message: {
        type: 'string',
        example: 'Foto atualizada com sucesso.',
      },
      data: {
        type: 'object',
        properties: {
          etag: {
            type: 'string',
            example: '3e73f59102c83ab67c509a414c22279e',
          },
          versionId: {
            type: 'string',
            nullable: true,
            example: null,
          },
        },
      },
      errors: {
        type: 'array',
        example: [],
      },
    },
    description: 'Schema para resposta de upload de foto do usuário',
  },
};

const removalMapping = {
  UsuarioItem: ['access_token', 'refresh_token', 'unique_token', 'password'],
  UsuarioDetalhes: ['access_token', 'unique_token', 'refresh_token', 'password'],
  UsuarioPost: [
    'access_token',
    'refresh_token',
    'unique_token',
    'createdAt',
    'updatedAt',
    '__v',
    '_id',
  ],
  UsuarioPutPatch: [
    'access_token',
    'refresh_token',
    'unique_token',
    'password',
    'email',
    'createdAt',
    'updatedAt',
    '__v',
    '_id',
  ],
  UsuarioLogin: [
    'access_token',
    'refresh_token',
    'unique_token',
    'active',
    'createdAt',
    'updatedAt',
    '__v',
    '_id',
    'full_name',
  ],
  UsuarioRespostaLogin: [
    'unique_token',
    'password',
    'createdAt',
    'updatedAt',
    '__v',
  ],
};

Object.entries(removalMapping).forEach(([schemaKey, fields]) => {
  if (usuariosSchemas[schemaKey]) {
    removeFieldsRecursively(usuariosSchemas[schemaKey], fields);
  }
});

const usuarioMongooseSchema = Usuario.schema;

usuariosSchemas.UsuarioItem.example = await generateExample(
  usuariosSchemas.UsuarioItem,
  null,
  usuarioMongooseSchema,
);
usuariosSchemas.UsuarioDetalhes.example = await generateExample(
  usuariosSchemas.UsuarioDetalhes,
  null,
  usuarioMongooseSchema,
);
usuariosSchemas.UsuarioPost.example = await generateExample(
  usuariosSchemas.UsuarioPost,
  null,
  usuarioMongooseSchema,
);
usuariosSchemas.UsuarioPutPatch.example = await generateExample(
  usuariosSchemas.UsuarioPutPatch,
  null,
  usuarioMongooseSchema,
);
usuariosSchemas.UsuarioLogin.example = await generateExample(
  usuariosSchemas.UsuarioLogin,
  null,
  usuarioMongooseSchema,
);
usuariosSchemas.UsuarioRespostaLogin.example = await generateExample(
  usuariosSchemas.UsuarioRespostaLogin,
  null,
  usuarioMongooseSchema,
);

export default usuariosSchemas;
