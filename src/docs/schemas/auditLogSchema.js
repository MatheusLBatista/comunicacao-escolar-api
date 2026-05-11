const auditLogSchemas = {
  AuditLogItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      school_id: { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
      user_id: { type: 'string', example: '6643b4a8c5d6e7f809102001' },
      action: { type: 'string', example: 'CREATE' },
      resourceType: { type: 'string', example: 'Post' },
      resourceId: { type: 'string', example: '664f1b2c3a9d4e0012345679' },
      details: { type: 'object', example: { title: 'Novo Comunicado' } },
      ipAddress: { type: 'string', example: '127.0.0.1' },
      userAgent: { type: 'string', example: 'Mozilla/5.0...' },
      createdAt: { type: 'string', format: 'date-time', example: '2026-04-03T12:00:00.000Z' },
    },
  },
  AuditLogListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: { type: 'array', items: { $ref: '#/components/schemas/AuditLogItem' } },
          totalDocs: { type: 'number', example: 100 },
          limit: { type: 'number', example: 10 },
          totalPages: { type: 'number', example: 10 },
          page: { type: 'number', example: 1 },
        },
      },
      error: { type: 'boolean', example: false },
    },
  },
};
export default auditLogSchemas;
