const auditLogSchemas = {
  AuditLogItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      school_id: { type: 'string', example: '000000000000000000000001' },
      user_id: { type: 'string', example: '000000000000000000000002' },
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
