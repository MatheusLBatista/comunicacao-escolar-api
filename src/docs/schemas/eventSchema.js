const eventSchemas = {
  EventTarget: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        enum: ['all', 'class'],
        default: 'all',
        description: 'Escopo de destino do evento',
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

  EventPost: {
    type: 'object',
    required: ['school_id', 'title', 'type', 'start_date'],
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      title: {
        type: 'string',
        description: 'Titulo do evento',
        example: 'Reuniao de pais',
      },
      description: {
        type: 'string',
        description: 'Descricao do evento',
        example: 'Alinhamento pedagogico com responsaveis.',
      },
      type: {
        type: 'string',
        enum: ['event', 'meeting', 'commemorative', 'pedagogical'],
        description: 'Tipo do evento',
        example: 'meeting',
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        description: 'Data/hora inicial do evento',
        example: '2026-04-10T14:30:00.000Z',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Data/hora final do evento',
        example: '2026-04-10T15:30:00.000Z',
      },
      all_day: {
        type: 'boolean',
        default: false,
        description: 'Define se o evento dura o dia todo',
        example: false,
      },
      target: {
        $ref: '#/components/schemas/EventTarget',
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status ativo do evento',
        example: true,
      },
    },
    additionalProperties: false,
  },

  EventPatch: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      title: {
        type: 'string',
        description: 'Titulo do evento',
        example: 'Reuniao de pais - atualizada',
      },
      description: {
        type: 'string',
        description: 'Descricao do evento',
        example: 'Descricao atualizada.',
      },
      type: {
        type: 'string',
        enum: ['event', 'meeting', 'commemorative', 'pedagogical'],
        description: 'Tipo do evento',
        example: 'event',
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        description: 'Data/hora inicial do evento',
        example: '2026-04-11T08:00:00.000Z',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Data/hora final do evento',
        example: null,
      },
      all_day: {
        type: 'boolean',
        description: 'Define se o evento dura o dia todo',
        example: false,
      },
      target: {
        $ref: '#/components/schemas/EventTarget',
      },
      active: {
        type: 'boolean',
        description: 'Status ativo do evento',
        example: true,
      },
    },
    additionalProperties: false,
  },

  EventItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664afbff3040506070809001' },
      school_id: {
        oneOf: [
          { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
          { type: 'object' },
        ],
      },
      title: { type: 'string', example: 'Reuniao de pais' },
      description: { type: 'string', example: 'Alinhamento pedagogico.' },
      type: {
        type: 'string',
        enum: ['event', 'meeting', 'commemorative', 'pedagogical'],
        example: 'meeting',
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-10T14:30:00.000Z',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2026-04-10T15:30:00.000Z',
      },
      all_day: { type: 'boolean', example: false },
      target: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'class'],
            example: 'class',
          },
          target_id: {
            oneOf: [
              {
                type: 'string',
                nullable: true,
                example: '6647f8ec0910203040506001',
              },
              { type: 'object', nullable: true },
            ],
          },
        },
      },
      created_by: {
        oneOf: [
          { type: 'string', example: '6644c5b9d6e7f80910203002' },
          { type: 'object' },
        ],
      },
      active: { type: 'boolean', example: true },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-10T13:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-10T13:15:00.000Z',
      },
    },
  },

  EventListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/EventItem' },
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

  EventFiltro: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['event', 'meeting', 'commemorative', 'pedagogical'],
        description: 'Filtrar por tipo de evento',
        example: 'event',
      },
      active: {
        type: 'boolean',
        description: 'Filtrar por status ativo',
        example: true,
      },
      scope: {
        type: 'string',
        enum: ['all', 'class'],
        description: 'Filtrar por escopo do alvo',
        example: 'class',
      },
      target_id: {
        type: 'string',
        description: 'Filtrar por turma alvo',
        example: '6647f8ec0910203040506001',
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        description: 'Filtrar a partir de data inicial',
        example: '2026-04-01T00:00:00.000Z',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        description: 'Filtrar ate data final',
        example: '2026-04-30T23:59:59.999Z',
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

export default eventSchemas;
