const schoolSchemas = {
  SchoolAddress: {
    type: 'object',
    properties: {
      street: {
        type: 'string',
        description: 'Rua da escola',
        example: 'Rua das Flores',
      },
      number: {
        type: 'string',
        description: 'Numero do endereco',
        example: '100',
      },
      city: {
        type: 'string',
        description: 'Cidade',
        example: 'Porto Velho',
      },
      state: {
        type: 'string',
        description: 'Estado',
        example: 'RO',
      },
      zip_code: {
        type: 'string',
        description: 'CEP',
        example: '76800000',
      },
    },
  },

  SchoolPost: {
    type: 'object',
    required: ['name', 'tax_id', 'address'],
    properties: {
      name: {
        type: 'string',
        description: 'Nome da escola',
        example: 'Escola Comunica Alunos',
      },
      tax_id: {
        type: 'string',
        description: 'CNPJ da escola (14 digitos)',
        example: '12345678000190',
      },
      address: {
        $ref: '#/components/schemas/SchoolAddress',
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status ativo da escola',
        example: true,
      },
    },
    additionalProperties: false,
  },

  SchoolPatchPut: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nome da escola',
        example: 'Escola Comunica Alunos Atualizada',
      },
      address: {
        $ref: '#/components/schemas/SchoolAddress',
      },
      active: {
        type: 'boolean',
        description: 'Status ativo da escola',
        example: false,
      },
    },
    additionalProperties: false,
  },

  SchoolItem: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '69d2e2353536b4f57ae190bc',
      },
      name: {
        type: 'string',
        example: 'Escola Comunica Alunos',
      },
      tax_id: {
        type: 'string',
        example: '12345678000190',
      },
      address: {
        $ref: '#/components/schemas/SchoolAddress',
      },
      active: {
        type: 'boolean',
        example: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-05T10:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-05T10:10:00.000Z',
      },
    },
  },

  SchoolListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/SchoolItem' },
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
      message: { type: 'string', example: 'Operacao realizada com sucesso' },
      errors: { type: 'array', example: [] },
    },
  },

  SchoolFiltro: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Filtrar por nome da escola',
        example: 'Comunica',
      },
      tax_id: {
        type: 'string',
        description: 'Filtrar por CNPJ',
        example: '12345678000190',
      },
      active: {
        type: 'boolean',
        description: 'Filtrar por status ativo',
        example: true,
      },
      city: {
        type: 'string',
        description: 'Filtrar por cidade',
        example: 'Porto Velho',
      },
      state: {
        type: 'string',
        description: 'Filtrar por estado',
        example: 'RO',
      },
      zip_code: {
        type: 'string',
        description: 'Filtrar por CEP',
        example: '76800000',
      },
      address: {
        type: 'string',
        description: 'Filtro textual para endereco',
        example: 'Rua das Flores',
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

export default schoolSchemas;
