import schoolSchemas from '../schemas/schoolSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const schoolPaths = {
  '/schools': {
    post: {
      tags: ['Escolas'],
      summary: 'Criar escola',
      description: `
            + Caso de uso: Criar uma nova escola no sistema.

            + Funcao de Negocio:
                - Permitir que usuarios autorizados criem escolas.

            + Regras de Negocio:
                - name, tax_id e address sao obrigatorios.
                - tax_id deve seguir o formato valido de CNPJ.

            + Resultado Esperado:
                - HTTP 201 Created com dados da escola criada.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SchoolPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/SchoolItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Escolas'],
      summary: 'Listar escolas',
      description: `
            + Caso de uso: Listar escolas com filtros opcionais.

            + Funcao de Negocio:
                - Retornar lista paginada de escolas.
                - Permitir filtros por nome, CNPJ, status e endereco.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de escolas.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(schoolSchemas.SchoolFiltro),
      responses: {
        200: {
          description: 'Lista de escolas retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SchoolListagem',
              },
            },
          },
        },
        400: commonResponses[400](),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/schools/{id}': {
    get: {
      tags: ['Escolas'],
      summary: 'Buscar escola por ID',
      description: `
            + Caso de uso: Buscar uma escola especifica pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes da escola.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID da escola',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/SchoolItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Escolas'],
      summary: 'Atualizar escola parcialmente',
      description: `
            + Caso de uso: Atualizar parcialmente uma escola existente.

            + Regras de Negocio:
                - tax_id nao pode ser alterado por esta operacao.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados da escola.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID da escola',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SchoolPatchPut',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/SchoolItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Escolas'],
      summary: 'Excluir escola',
      description: `
            + Caso de uso: Excluir uma escola pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os dados da escola removida.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID da escola',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/SchoolItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default schoolPaths;
