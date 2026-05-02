import commonResponses from '../schemas/swaggerCommonResponses.js';

const auditLogPaths = {
  '/schools/{id}/audit-logs': {
    get: {
      tags: ['Audit Log'],
      summary: 'Listar logs de auditoria da escola',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
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
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID da escola' },
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
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'resourceType', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'resourceId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/AuditLogListagem'),
      },
    },
  },
};
export default auditLogPaths;
