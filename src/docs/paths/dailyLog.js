import commonResponses from '../schemas/swaggerCommonResponses.js';

const dailyLogPaths = {
  '/daily-logs': {
    get: {
      tags: ['Rotina Diária'],
      summary: 'Listar diários',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'student_id',
          in: 'query',
          schema: { type: 'string', example: '6646e7dbf8091020304050a1' },
          description: 'Filtrar por ID do aluno',
        },
        {
          name: 'date',
          in: 'query',
          schema: { type: 'string', format: 'date', example: '2026-05-11' },
          description: 'Filtrar por data (YYYY-MM-DD)',
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1, example: 1 },
          description: 'Número da página',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10, example: 10 },
          description: 'Itens por página',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogListagem'),
        401: commonResponses[401](),
      },
    },
    post: {
      tags: ['Rotina Diária'],
      summary: 'Criar diário',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DailyLogPost' },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/DailyLogItem'),
        400: commonResponses[400](),
      },
    },
  },
  '/daily-logs/{id}': {
    get: {
      tags: ['Rotina Diária'],
      summary: 'Buscar diário por ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: '6649faee2030405060708001',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogItem'),
      },
    },
    patch: {
      tags: ['Rotina Diária'],
      summary: 'Atualizar diário',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: '6649faee2030405060708001',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DailyLogPost' },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogItem'),
      },
    },
    delete: {
      tags: ['Rotina Diária'],
      summary: 'Desativar diário',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: '6649faee2030405060708001',
        },
      ],
      responses: { 200: commonResponses[200]() },
    },
  },
  '/daily-logs/{id}/read': {
    patch: {
      tags: ['Rotina Diária'],
      summary: 'Marcar diário como lido',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: '6649faee2030405060708001',
        },
      ],
      responses: { 200: commonResponses[200]() },
    },
  },
};
export default dailyLogPaths;
