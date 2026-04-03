import postSchemas from '../schemas/postSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const postPaths = {
  '/post': {
    post: {
      tags: ['Comunicados'],
      summary: 'Criar comunicado',
      description: `
            + Caso de uso: Criar um novo comunicado no mural da escola.

            + Função de Negócio:
                - Permitir que usuários autenticados autorizados criem comunicados.
                - O autor é definido automaticamente pelo token da sessão.

            + Regras de Negócio:
                - school_id deve existir.
                - Se target.scope for class, target_id é obrigatório.
                - Quando informado, target_id deve corresponder a uma turma existente.

            + Resultado Esperado:
                - HTTP 201 Created com dados do comunicado criado.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PostPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Comunicados'],
      summary: 'Listar comunicados',
      description: `
            + Caso de uso: Listar comunicados do mural com filtros opcionais.

            + Função de Negócio:
                - Retornar lista paginada de comunicados.
                - Permitir filtros por escola, autor, conteúdo e target.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de comunicados.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(postSchemas.PostFiltro),
      responses: {
        200: {
          description: 'Lista de comunicados retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PostListagem',
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

  '/post/{id}': {
    get: {
      tags: ['Comunicados'],
      summary: 'Buscar comunicado por ID',
      description: `
            + Caso de uso: Buscar um comunicado específico pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes do comunicado.
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
          description: 'ID do comunicado',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default postPaths;