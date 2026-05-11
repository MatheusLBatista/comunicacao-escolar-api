const dailyLogTemplateSchemas = {
  DailyLogTemplateField: {
    type: 'object',
    required: ['key', 'label', 'type'],
    properties: {
      key: {
        type: 'string',
        description: 'Identificador do campo no preenchimento do diario',
        example: 'mood_status',
      },
      label: {
        type: 'string',
        description: 'Titulo exibido no formulario',
        example: 'Disposicao',
      },
      type: {
        type: 'string',
        enum: ['select', 'text', 'boolean'],
        description: 'Tipo do campo de preenchimento',
        example: 'select',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de opcoes para campos do tipo select',
        example: ['Feliz', 'Neutro', 'Triste'],
      },
    },
    additionalProperties: false,
  },

  DailyLogTemplatePost: {
    type: 'object',
    required: ['school_id', 'fields'],
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        nullable: true,
        description:
          'ObjectId do aluno quando o template for especifico; null para template geral da escola',
        example: null,
      },
      fields: {
        type: 'array',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/DailyLogTemplateField',
        },
      },
      ativo: {
        type: 'boolean',
        default: true,
        description: 'Status ativo do template',
        example: true,
      },
    },
    additionalProperties: false,
  },

  DailyLogTemplatePatchPut: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId do aluno; null para template geral',
        example: '6646e7dbf8091020304050a1',
      },
      fields: {
        type: 'array',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/DailyLogTemplateField',
        },
      },
      ativo: {
        type: 'boolean',
        description: 'Status ativo do template',
        example: true,
      },
    },
    additionalProperties: false,
  },

  DailyLogTemplateItem: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '6648f9ed1020304050607001',
      },
      school_id: {
        oneOf: [
          { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
          { type: 'object' },
        ],
      },
      student_id: {
        oneOf: [
          { type: 'string', nullable: true, example: null },
          { type: 'object', nullable: true },
        ],
      },
      fields: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/DailyLogTemplateField',
        },
      },
      ativo: {
        type: 'boolean',
        example: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-07T13:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-07T13:20:00.000Z',
      },
    },
  },

  DailyLogTemplateListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/DailyLogTemplateItem',
            },
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

  DailyLogTemplateFiltro: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'Filtrar por escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        description: 'Filtrar por aluno especifico',
        example: '6646e7dbf8091020304050a1',
      },
      ativo: {
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

export default dailyLogTemplateSchemas;
