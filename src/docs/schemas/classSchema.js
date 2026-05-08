const classSchemas = {
  ClassPost: {
    type: 'object',
    required: ['name', 'shift', 'year', 'teacher_ids'],
    properties: {
      name: {
        type: 'string',
        description: 'Nome da turma',
        example: 'Turma A',
      },
      shift: {
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
      shift: { type: 'string', example: '5o ano' },
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

  ClassPatch: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome da turma',
        example: 'Turma A - Atualizada',
      },
      shift: {
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
      metadata: {
        type: 'string',
        description: 'Metadados adicionais da turma',
        example: 'Turno vespertino',
      },
    },
    additionalProperties: false,
  },

  ClassListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/ClassItem' },
          },
          totalDocs: { type: 'number', example: 2 },
          limit: { type: 'number', example: 10 },
          totalPages: { type: 'number', example: 1 },
          page: { type: 'number', example: 1 },
          pagingCounter: { type: 'number', example: 1 },
          hasPrevPage: { type: 'boolean', example: false },
          hasNextPage: { type: 'boolean', example: false },
          prevPage: { type: 'number', nullable: true, example: null },
          nextPage: { type: 'number', nullable: true, example: null },
        },
      },
      message: { type: 'string', example: 'Operacao realizada com sucesso' },
      errors: { type: 'array', example: [] },
    },
  },

  ClassFiltro: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Filtrar por nome da turma',
        example: 'Turma',
      },
      shift: {
        type: 'string',
        description: 'Filtrar por serie/grau',
        example: '5o ano',
      },
      year: {
        type: 'integer',
        description: 'Filtrar por ano letivo',
        example: 2026,
      },
      teacher_id: {
        type: 'string',
        description: 'Filtrar por professor vinculado',
        example: '69d2e2353536b4f57ae1911c',
      },
      active: {
        type: 'boolean',
        description: 'Filtrar por status ativo',
        example: true,
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        example: 1,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        example: 10,
      },
    },
  },
};

export default classSchemas;
