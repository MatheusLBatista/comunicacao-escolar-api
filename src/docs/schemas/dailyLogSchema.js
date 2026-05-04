const dailyLogSchemas = {
  DailyLogItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      school_id: { type: 'string', example: '000000000000000000000001' },
      student_id: { type: 'string', example: '000000000000000000000003' },
      author_id: { type: 'string', example: '000000000000000000000002' },
      date: { type: 'string', format: 'date', example: '2026-04-03' },
      content: { type: 'object', example: { alimentacao: 'Boa', sono: '2h' } },
      read_by: { type: 'array', items: { type: 'string' }, example: [] },
      active: { type: 'boolean', example: true },
    },
  },
  DailyLogPost: {
    type: 'object',
    required: ['student_id', 'date', 'content'],
    properties: {
      student_id: { type: 'string', example: '000000000000000000000003' },
      date: { type: 'string', format: 'date', example: '2026-04-03' },
      content: { type: 'object', example: { alimentacao: 'Boa', sono: '2h' } },
    },
  },
  DailyLogListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: { type: 'array', items: { $ref: '#/components/schemas/DailyLogItem' } },
          totalDocs: { type: 'number', example: 50 },
          limit: { type: 'number', example: 10 },
          page: { type: 'number', example: 1 },
        },
      },
      error: { type: 'boolean', example: false },
    },
  },
};
export default dailyLogSchemas;
