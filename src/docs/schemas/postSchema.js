const postSchemas = {
  PostTarget: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        enum: ['all', 'class'],
        default: 'all',
        description: 'Escopo de destino do comunicado',
        example: 'all',
      },
      target_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId da turma quando scope for class',
        example: null,
      },
    },
  },

  PostPost: {
    type: 'object',
    required: ['school_id', 'title', 'content'],
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '000000000000000000000001',
      },
      title: {
        type: 'string',
        description: 'Título do comunicado',
        example: 'Comunicado de reunião pedagógica',
      },
      content: {
        type: 'string',
        description: 'Conteúdo do comunicado',
        example: 'A reunião pedagógica acontecerá na próxima sexta-feira.',
      },
      target: {
        $ref: '#/components/schemas/PostTarget',
      },
      attachments: {
        type: 'array',
        items: { type: 'string', format: 'uri' },
        description: 'Lista de URLs de anexos',
        example: [],
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status do comunicado',
        example: true,
      },
    },
    additionalProperties: false,
  },

  PostItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      school_id: { type: 'string', example: '000000000000000000000001' },
      author_id: { type: 'string', example: '000000000000000000000002' },
      title: {
        type: 'string',
        example: 'Comunicado de reunião pedagógica',
      },
      content: {
        type: 'string',
        example: 'A reunião pedagógica acontecerá na próxima sexta-feira.',
      },
      target: {
        $ref: '#/components/schemas/PostTarget',
      },
      attachments: {
        type: 'array',
        items: { type: 'string', format: 'uri' },
        example: [],
      },
      active: { type: 'boolean', example: true },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-03T12:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-03T12:00:00.000Z',
      },
    },
  },

  PostListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/PostItem' },
          },
          totalDocs: { type: 'number', example: 3 },
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
      message: { type: 'string', example: 'Operação realizada com sucesso' },
      errors: { type: 'array', example: [] },
    },
  },

  PostFiltro: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'Filtrar por escola',
        example: '000000000000000000000001',
      },
      author_id: {
        type: 'string',
        description: 'Filtrar por autor',
        example: '000000000000000000000002',
      },
      title: {
        type: 'string',
        description: 'Filtrar por título',
        example: 'Comunicado',
      },
      content: {
        type: 'string',
        description: 'Filtrar por conteúdo',
        example: 'reunião',
      },
      scope: {
        type: 'string',
        enum: ['all', 'class'],
        description: 'Filtrar por escopo do target',
        example: 'all',
      },
      target_id: {
        type: 'string',
        description: 'Filtrar por target_id',
        example: '000000000000000000000010',
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

export default postSchemas;
