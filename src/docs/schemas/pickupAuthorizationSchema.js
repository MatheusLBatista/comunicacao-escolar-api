const pickupAuthorizationSchemas = {
  PickupAuthorizedPerson: {
    type: 'object',
    required: ['name', 'document', 'relationship'],
    properties: {
      name: {
        type: 'string',
        description: 'Nome da pessoa autorizada para retirada',
        example: 'Maria da Silva',
      },
      document: {
        type: 'string',
        description: 'Documento da pessoa autorizada',
        example: '123.456.789-00',
      },
      relationship: {
        type: 'string',
        description: 'Grau de parentesco ou relacao',
        example: 'Avo',
      },
      photo_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        description: 'URL da foto da pessoa autorizada',
        example: null,
      },
    },
  },

  PickupAuthorizationPost: {
    type: 'object',
    required: [
      'school_id',
      'student_id',
      'authorized_by',
      'authorized_person',
      'valid_from',
      'valid_until',
    ],
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        description: 'ObjectId do aluno (membership role student)',
        example: '6646e7dbf8091020304050a1',
      },
      authorized_by: {
        type: 'string',
        description: 'ObjectId do responsavel (membership role parent)',
        example: '6645d6cae7f8091020304003',
      },
      authorized_person: {
        $ref: '#/components/schemas/PickupAuthorizedPerson',
      },
      qr_code: {
        type: 'string',
        description: 'Codigo QR da autorizacao',
        example: 'PA-TESTE-001',
      },
      valid_from: {
        type: 'string',
        format: 'date-time',
        description: 'Inicio da validade da autorizacao',
        example: '2026-04-06T08:00:00.000Z',
      },
      valid_until: {
        type: 'string',
        format: 'date-time',
        description: 'Fim da validade da autorizacao',
        example: '2026-05-06T18:00:00.000Z',
      },
      used: {
        type: 'boolean',
        default: false,
        description: 'Indica se a autorizacao ja foi utilizada',
        example: false,
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status ativo da autorizacao',
        example: true,
      },
    },
    additionalProperties: false,
  },

  PickupAuthorizationPatch: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'ObjectId da escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        description: 'ObjectId do aluno (membership role student)',
        example: '6646e7dbf8091020304050a1',
      },
      authorized_by: {
        type: 'string',
        description: 'ObjectId do responsavel (membership role parent)',
        example: '6645d6cae7f8091020304003',
      },
      authorized_person: {
        $ref: '#/components/schemas/PickupAuthorizedPerson',
      },
      qr_code: {
        type: 'string',
        description: 'Codigo QR da autorizacao',
        example: 'PA-TESTE-002',
      },
      valid_from: {
        type: 'string',
        format: 'date-time',
        description: 'Inicio da validade da autorizacao',
        example: '2026-04-10T08:00:00.000Z',
      },
      valid_until: {
        type: 'string',
        format: 'date-time',
        description: 'Fim da validade da autorizacao',
        example: '2026-05-10T18:00:00.000Z',
      },
      used: {
        type: 'boolean',
        description: 'Indica se a autorizacao ja foi utilizada',
        example: false,
      },
      active: {
        type: 'boolean',
        description: 'Status ativo da autorizacao',
        example: true,
      },
    },
    additionalProperties: false,
  },

  PickupAuthorizationItem: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '664cfd005060708090101001',
      },
      school_id: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      student_id: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      authorized_by: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      authorized_person: {
        $ref: '#/components/schemas/PickupAuthorizedPerson',
      },
      qr_code: {
        type: 'string',
        example: 'PA-TESTE-001',
      },
      valid_from: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-06T08:00:00.000Z',
      },
      valid_until: {
        type: 'string',
        format: 'date-time',
        example: '2026-05-06T18:00:00.000Z',
      },
      used: {
        type: 'boolean',
        example: false,
      },
      active: {
        type: 'boolean',
        example: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-06T10:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-06T10:05:00.000Z',
      },
    },
  },

  PickupAuthorizationListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/PickupAuthorizationItem' },
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
      message: { type: 'string', example: 'Operação realizada com sucesso' },
      errors: { type: 'array', example: [] },
    },
  },

  PickupAuthorizationFiltro: {
    type: 'object',
    properties: {
      school_id: {
        type: 'string',
        description: 'Filtrar por escola',
        example: '6642a3f7b4c5d6e7f8091001',
      },
      student_id: {
        type: 'string',
        description: 'Filtrar por aluno',
        example: '6646e7dbf8091020304050a1',
      },
      authorized_by: {
        type: 'string',
        description: 'Filtrar por responsavel',
        example: '6645d6cae7f8091020304003',
      },
      used: {
        type: 'boolean',
        description: 'Filtrar por utilizado',
        example: false,
      },
      active: {
        type: 'boolean',
        description: 'Filtrar por ativo',
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

export default pickupAuthorizationSchemas;
