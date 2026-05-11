import pickupLogSchemas from '../schemas/pickupLogSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const pickupLogPaths = {
  '/pickup-logs': {
    post: {
      tags: ['Logs de Retirada'],
      summary: 'Criar log de retirada',
      description: `
            + Caso de uso: Registrar uma retirada de aluno.

            + Funcao de Negocio:
                - Cadastra um log vinculado a escola, aluno e verificador.
                - Permite retirada manual ou via autorizacao com QR code.

            + Regras de Negocio:
                - school_id deve existir.
                - student_id deve ser usuario com membership role student.
                - verified_by deve ser usuario com membership role admin ou teacher.
                - picked_up_by.user_id, quando informado, deve ser usuario com role parent.
                - picked_up_by.user_id deve ser diferente de student_id.
                - Quando method=qr_code, authorization_id e obrigatorio.
                - authorization_id deve pertencer a mesma escola e ao mesmo aluno informados.

            + Resultado Esperado:
                - HTTP 201 Created com os dados do log criado.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PickupLogPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/PickupLogItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Logs de Retirada'],
      summary: 'Listar logs de retirada',
      description: `
            + Caso de uso: Listar logs de retirada com filtros opcionais.

            + Funcao de Negocio:
                - Retorna lista paginada de logs de retirada.
                - Permite filtros por escola, aluno, autorizacao, verificador,
                  metodo, status e intervalo de datas.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(pickupLogSchemas.PickupLogFiltro),
      responses: {
        200: {
          description: 'Lista de logs de retirada retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PickupLogListagem',
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

  '/pickup-logs/{id}': {
    get: {
      tags: ['Logs de Retirada'],
      summary: 'Buscar log de retirada por ID',
      description: `
            + Caso de uso: Buscar um log de retirada especifico por identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes do log.
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
          description: 'ID do log de retirada',
          example: '664dfe006070809010201001',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/PickupLogItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Logs de Retirada'],
      summary: 'Atualizar log de retirada',
      description: `
            + Caso de uso: Atualizar parcialmente um log de retirada existente.

            + Regras de Negocio:
                - Se school_id for informado, deve existir.
                - Se student_id for informado, deve ser role student.
                - Se verified_by for informado, deve ser role admin ou teacher.
                - Se picked_up_by.user_id for informado, deve ser role parent.
                - picked_up_by.user_id deve ser diferente de student_id.
                - Quando method=qr_code, authorization_id e obrigatorio.
                - authorization_id deve pertencer a mesma escola e aluno.

            + Resultado Esperado:
                - HTTP 200 OK com os dados atualizados.
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
          description: 'ID do log de retirada',
          example: '664dfe006070809010201001',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PickupLogPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/PickupLogItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Logs de Retirada'],
      summary: 'Excluir log de retirada',
      description: `
            + Caso de uso: Excluir um log de retirada pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os dados do log removido.
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
          description: 'ID do log de retirada',
          example: '664dfe006070809010201001',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/PickupLogItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default pickupLogPaths;
