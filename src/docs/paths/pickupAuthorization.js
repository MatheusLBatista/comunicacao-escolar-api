import pickupAuthorizationSchemas from '../schemas/pickupAuthorizationSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const pickupAuthorizationPaths = {
  '/pickup-authorizations': {
    post: {
      tags: ['Autorizações de Retirada'],
      summary: 'Criar autorização de retirada',
      description: `
            + Caso de uso: Criar uma nova autorização de retirada para um aluno.

            + Função de Negócio:
                - Cadastra uma autorização vinculada a escola, aluno e responsável.

            + Regras de Negócio:
                - school_id deve existir.
                - student_id deve ser usuário com membership role student.
                - authorized_by deve ser usuário com membership role parent.
                - authorized_by deve ser diferente de student_id.
                - valid_until deve ser maior que valid_from.

            + Resultado Esperado:
                - HTTP 201 Created com dados da autorização criada.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PickupAuthorizationPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201](
          '#/components/schemas/PickupAuthorizationItem',
        ),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Autorizações de Retirada'],
      summary: 'Listar autorizações de retirada',
      description: `
            + Caso de uso: Listar autorizações de retirada com filtros opcionais.

            + Função de Negócio:
                - Retorna lista paginada de autorizações.
                - Permite filtros por escola, aluno, responsável e status.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(
        pickupAuthorizationSchemas.PickupAuthorizationFiltro,
      ),
      responses: {
        200: {
          description: 'Lista de autorizações retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PickupAuthorizationListagem',
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

  '/pickup-authorizations/{id}': {
    get: {
      tags: ['Autorizações de Retirada'],
      summary: 'Buscar autorização de retirada por ID',
      description: `
            + Caso de uso: Buscar uma autorização específica pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes da autorização.
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
          description: 'ID da autorização de retirada',
        },
      ],
      responses: {
        200: commonResponses[200](
          '#/components/schemas/PickupAuthorizationItem',
        ),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Autorizações de Retirada'],
      summary: 'Atualizar autorização de retirada',
      description: `
            + Caso de uso: Atualizar dados de uma autorização existente.

            + Regras de Negócio:
                - Se authorized_person for enviado, deve conter name, document e relationship.
                - Se alterar student_id/authorized_by, validar roles e diferença entre os campos.
                - Se alterar datas, valid_until deve ser maior que valid_from.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados.
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
          description: 'ID da autorização de retirada',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PickupAuthorizationPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200](
          '#/components/schemas/PickupAuthorizationItem',
        ),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Autorizações de Retirada'],
      summary: 'Excluir autorização de retirada',
      description: `
            + Caso de uso: Excluir uma autorização de retirada pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os dados da autorização removida.
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
          description: 'ID da autorização de retirada',
        },
      ],
      responses: {
        200: commonResponses[200](
          '#/components/schemas/PickupAuthorizationItem',
        ),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default pickupAuthorizationPaths;
