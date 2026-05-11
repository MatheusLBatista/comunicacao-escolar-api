import commonResponses from '../schemas/swaggerCommonResponses.js';

const auditLogPaths = {
  '/schools/{id}/audit-logs': {
    get: {
      tags: ['Audit Log'],
      summary: 'Listar logs de auditoria da escola',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola', example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 }, description: 'Número da página' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, example: 10 }, description: 'Itens por página' },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogListagem'),
        401: commonResponses[401](),
        403: commonResponses[403](),
        498: commonResponses[498](),
      },
    },
  },
  '/schools/{id}/audit-logs/summary': {
    get: {
      tags: ['Audit Log'],
      summary: 'Resumo dos logs de auditoria',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola', example: '6642a3f7b4c5d6e7f8091001' },
      ],
      responses: {
        200: commonResponses[200](),
        401: commonResponses[401](),
        403: commonResponses[403](),
      },
    },
  },
  '/schools/{id}/audit-logs/resource/{resourceType}/{resourceId}': {
    get: {
      tags: ['Audit Log'],
      summary: 'Listar logs por recurso',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'resourceType', in: 'path', required: true, schema: { type: 'string' }, example: 'User' },
        { name: 'resourceId', in: 'path', required: true, schema: { type: 'string' }, example: '6643b4a8c5d6e7f809102001' },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogListagem'),
      },
    },
  },
  '/schools/{id}/audit-logs/user/{userId}': {
    get: {
      tags: ['Audit Log'],
      summary: 'Listar logs por usuário',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola', example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID do usuário', example: '6643b4a8c5d6e7f809102001' },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogListagem'),
        401: commonResponses[401](),
        403: commonResponses[403](),
      },
    },
  },
  '/schools/{id}/audit-logs/student/{studentId}': {
    get: {
      tags: ['Audit Log'],
      summary: 'Listar logs por aluno',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola', example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID do aluno', example: '6646e7dbf8091020304050a1' },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogListagem'),
        401: commonResponses[401](),
        403: commonResponses[403](),
      },
    },
  },
  '/schools/{id}/audit-logs/{logId}': {
    get: {
      tags: ['Audit Log'],
      summary: 'Buscar log de auditoria por ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola', example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'logId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID do log de auditoria', example: '664f1b2c3a9d4e0012345671' },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogItem'),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
      },
    },
  },
};
export default auditLogPaths;
