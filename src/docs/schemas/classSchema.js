const classSchemas = {
  ClassPost: {
    type: 'object',
    required: ['name', 'grade', 'year', 'teacher_ids'],
    properties: {
      name: {
        type: 'string',
        description: 'Nome da turma',
        example: 'Turma A',
      },
      grade: {
        type: 'string',
        description: 'Serie/grau da turma',
        example: '5o ano',
      },
      year: {
        type: 'integer',
        description: 'Ano letivo da turma',
        example: 2026,
      },
      teacher_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de ObjectIds dos professores',
        example: ['69d2e2353536b4f57ae1911c'],
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status ativo da turma',
        example: true,
      },
      metadata: {
        type: 'string',
        description: 'Metadados adicionais da turma',
        example: 'Turno matutino',
      },
    },
    additionalProperties: false,
  },

  ClassItem: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '69d2e2353536b4f57ae1911c',
      },
      school_id: {
        oneOf: [
          { type: 'string', example: '69d2e2353536b4f57ae190bc' },
          { type: 'object' },
        ],
      },
      name: { type: 'string', example: 'Turma A' },
      grade: { type: 'string', example: '5o ano' },
      year: { type: 'integer', example: 2026 },
      teacher_ids: {
        type: 'array',
        items: { type: 'string' },
        example: ['69d2e2353536b4f57ae1911c'],
      },
      active: { type: 'boolean', example: true },
      metadata: { type: 'string', example: 'Turno matutino' },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-10T10:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-10T10:15:00.000Z',
      },
    },
  },
};

export default classSchemas;
