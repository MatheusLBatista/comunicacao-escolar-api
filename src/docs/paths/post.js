import postSchemas from '../schemas/postSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const postPaths = {
  '/schools/{schoolId}/post': {
    post: {
      tags: ['Comunicados'],
      summary: 'Criar comunicado',
      description: `
            + Caso de uso: Criar um novo comunicado no mural da escola.

            + Função de Negócio:
                - Permitir que usuários autenticados autorizados criem comunicados na escola.
                - O autor é definido automaticamente pelo token da sessão.
                - O school_id é extraído da URL e não precisa ser enviado no corpo da requisição.

            + Regras de Negócio:
                - A escola (schoolId) deve existir.
                - Se target.scope for class, target_id é obrigatório.
                - Quando informado, target_id deve corresponder a uma turma existente da mesma escola.

            + Resultado Esperado:
                - HTTP 201 Created com dados do comunicado criado.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'schoolId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da escola',
          example: '000000000000000000000001',
        },
      ],
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
      summary: 'Listar comunicados da escola',
      description: `
            + Caso de uso: Listar comunicados do mural da escola com filtros opcionais.

            + Função de Negócio:
                - Retornar lista paginada de comunicados da escola especificada.
                - Permitir filtros por autor, conteúdo e target.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de comunicados.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'schoolId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da escola',
          example: '000000000000000000000001',
        },
        ...generateParameters(postSchemas.PostFiltro),
      ],
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

    patch: {
      tags: ['Comunicados'],
      summary: 'Atualizar comunicado',
      description: `
            + Caso de uso: Atualizar um comunicado existente.

            + Função de Negócio:
                - Permitir que usuários autenticados autorizados atualizem comunicados.
                - Apenas o autor do comunicado ou usuários com permissão podem atualizar.

            + Regras de Negócio:
                - O comunicado deve existir.
                - Todos os campos são opcionais.
                - Se target.scope for class, target_id é obrigatório.
                - Quando informado, target_id deve corresponder a uma turma existente.

            + Resultado Esperado:
                - HTTP 200 OK com dados do comunicado atualizado.
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PostPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default postPaths;