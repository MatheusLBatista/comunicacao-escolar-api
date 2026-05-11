const dailyLogSchemas = {
  DailyLogItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6649faee2030405060708001' },
      school_id: { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
      student_id: { type: 'string', example: '6646e7dbf8091020304050a1' },
      author_id: { type: 'string', example: '6643b4a8c5d6e7f809102001' },
      date: { type: 'string', format: 'date', example: '2026-04-03' },
      content: { type: 'object', example: { alimentacao: 'Boa', sono: '2h' } },
      read_by: { type: 'array', items: { type: 'string' }, example: [] },
      active: { type: 'boolean', example: true },
    },
  },
  DailyLogPost: {
    type: 'object',
    required: ['school_id', 'student_id', 'teacher_id', 'dailylogtemplate_id', 'is_present', 'date'],
    properties: {
      school_id: { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
      student_id: { type: 'string', example: '6646e7dbf8091020304050a1', description: 'ID do aluno (role=student na escola)' },
      teacher_id: { type: 'string', example: '6644c5b9d6e7f80910203002', description: 'ID do professor (role=teacher na escola)' },
      dailylogtemplate_id: { type: 'string', example: '6648f9ed1020304050607001', description: 'ID do template de rotina diária (use GET /daily-log-templates para obter)' },
      is_present: { type: 'boolean', example: true, description: 'Indica se o aluno estava presente' },
      date: { type: 'string', format: 'date', example: '2026-05-11' },
      entries: {
        type: 'array',
        description: 'Respostas para cada campo do template (necessário quando is_present=true)',
        items: {
          type: 'object',
          required: ['field_key', 'value'],
          properties: {
            field_key: { type: 'string', example: 'mood_status' },
            value: { type: 'string', example: 'Feliz' },
          },
        },
        example: [
          { field_key: 'mood_status', value: 'Feliz' },
          { field_key: 'participation', value: 'Alta' },
          { field_key: 'food_intake', value: 'Comeu bem' },
        ],
      },
      observation: { type: 'string', example: 'Aluno demonstrou ótimo desempenho hoje.', default: '' },
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
