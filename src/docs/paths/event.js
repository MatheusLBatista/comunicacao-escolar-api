import eventSchemas from '../schemas/eventSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const eventPaths = {
  '/events': {
    post: {
      tags: ['Eventos'],
      summary: 'Criar evento',
      description: `
            + Caso de uso: Criar um novo evento escolar.

            + Funcao de Negocio:
                - Permitir que usuarios autenticados e autorizados criem eventos.
                - O campo created_by e definido automaticamente pelo token da sessao.

            + Regras de Negocio:
                - school_id deve existir.
                - Se target.scope for class, target.target_id e obrigatorio e deve existir.
                - Para type=meeting, all_day deve ser false e start_date deve conter horario.

            + Resultado Esperado:
                - HTTP 201 Created com dados do evento criado.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/EventPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/EventItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Eventos'],
      summary: 'Listar eventos',
      description: `
            + Caso de uso: Listar eventos com filtros opcionais.

            + Funcao de Negocio:
                - Retornar lista paginada de eventos.
                - Permitir filtros por tipo, escopo, turma alvo e periodo.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de eventos.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(eventSchemas.EventFiltro),
      responses: {
        200: {
          description: 'Lista de eventos retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EventListagem',
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

  '/events/{id}': {
    get: {
      tags: ['Eventos'],
      summary: 'Buscar evento por ID',
      description: `
            + Caso de uso: Buscar um evento especifico por identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes do evento.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do evento',
          example: '664afbff3040506070809001',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/EventItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Eventos'],
      summary: 'Atualizar evento',
      description: `
            + Caso de uso: Atualizar parcialmente um evento existente.

            + Regras de Negocio:
                - Se school_id for informado, deve existir.
                - Se target.scope for class, target.target_id e obrigatorio e deve existir.
                - Para type=meeting, all_day deve ser false e start_date com horario.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do evento.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do evento',
          example: '664afbff3040506070809001',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/EventPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/EventItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Eventos'],
      summary: 'Excluir evento',
      description: `
            + Caso de uso: Excluir um evento pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os dados do evento removido.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID do evento',
          example: '664afbff3040506070809001',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/EventItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default eventPaths;
