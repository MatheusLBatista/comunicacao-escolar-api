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
        example: ['6644c5b9d6e7f80910203002'],
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
        example: '6647f8ec0910203040506001',
      },
      school_id: {
        oneOf: [
          { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
          { type: 'object' },
        ],
      },
      name: { type: 'string', example: 'Turma A' },
      shift: { type: 'string', example: '5o ano' },
      year: { type: 'integer', example: 2026 },
      teacher_ids: {
        type: 'array',
        items: { type: 'string' },
        example: ['6644c5b9d6e7f80910203002'],
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
        example: ['6644c5b9d6e7f80910203002'],
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
        example: '6644c5b9d6e7f80910203002',
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
