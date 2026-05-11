const pickupLogSchemas = {
  PickupLogPickedUpBy: {
    type: 'object',
    required: ['name', 'document'],
    properties: {
      user_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId do responsavel que realizou a retirada',
        example: '6645d6cae7f8091020304003',
      },
      name: {
        type: 'string',
        description: 'Nome da pessoa que retirou o aluno',
        example: 'Ana Souza',
      },
      document: {
        type: 'string',
        description: 'Documento da pessoa que retirou o aluno',
        example: '123.456.789-00',
      },
    },
  },

  PickupLogPickedUpByPatch: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId do responsavel que realizou a retirada',
        example: '6645d6cae7f8091020304003',
      },
      name: {
        type: 'string',
        description: 'Nome da pessoa que retirou o aluno',
        example: 'Ana Souza',
      },
      document: {
        type: 'string',
        description: 'Documento da pessoa que retirou o aluno',
        example: '123.456.789-00',
      },
    },
  },

  PickupLogPost: {
    type: 'object',
    required: [
      'school_id',
      'student_id',
      'picked_up_by',
      'method',
      'departure_time',
      'verified_by',
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
      authorization_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId da autorizacao de retirada (obrigatorio quando method=qr_code)',
        example: null,
      },
      picked_up_by: {
        $ref: '#/components/schemas/PickupLogPickedUpBy',
      },
      method: {
        type: 'string',
        enum: ['qr_code', 'manual'],
        description: 'Metodo utilizado na retirada',
        example: 'manual',
      },
      departure_time: {
        type: 'string',
        format: 'date-time',
        description: 'Data e horario da retirada do aluno',
        example: '2026-04-13T17:00:00.000Z',
      },
      verified_by: {
        type: 'string',
        description:
          'ObjectId do usuario que validou a retirada (admin ou teacher)',
        example: '6643b4a8c5d6e7f809102001',
      },
      notes: {
        type: 'string',
        description: 'Observacoes sobre a retirada',
        example: 'Retirada realizada na portaria principal.',
      },
      active: {
        type: 'boolean',
        default: true,
        description: 'Status ativo do registro',
        example: true,
      },
    },
    additionalProperties: false,
  },

  PickupLogPatch: {
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
      authorization_id: {
        type: 'string',
        nullable: true,
        description: 'ObjectId da autorizacao de retirada (obrigatorio quando method=qr_code)',
        example: null,
      },
      picked_up_by: {
        $ref: '#/components/schemas/PickupLogPickedUpByPatch',
      },
      method: {
        type: 'string',
        enum: ['qr_code', 'manual'],
        description: 'Metodo utilizado na retirada',
        example: 'qr_code',
      },
      departure_time: {
        type: 'string',
        format: 'date-time',
        description: 'Data e horario da retirada do aluno',
        example: '2026-04-13T17:10:00.000Z',
      },
      verified_by: {
        type: 'string',
        description:
          'ObjectId do usuario que validou a retirada (admin ou teacher)',
        example: '6643b4a8c5d6e7f809102001',
      },
      notes: {
        type: 'string',
        description: 'Observacoes sobre a retirada',
        example: 'Atualizado para retirada via QR.',
      },
      active: {
        type: 'boolean',
        description: 'Status ativo do registro',
        example: false,
      },
    },
    additionalProperties: false,
  },

  PickupLogItem: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '664dfe006070809010201001',
      },
      school_id: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      student_id: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      authorization_id: {
        oneOf: [{ type: 'string' }, { type: 'object' }, { type: 'null' }],
      },
      picked_up_by: {
        $ref: '#/components/schemas/PickupLogPickedUpBy',
      },
      method: {
        type: 'string',
        enum: ['qr_code', 'manual'],
        example: 'manual',
      },
      departure_time: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-13T17:00:00.000Z',
      },
      verified_by: {
        oneOf: [{ type: 'string' }, { type: 'object' }],
      },
      notes: {
        type: 'string',
        example: 'Registro padrao de retirada.',
      },
      active: {
        type: 'boolean',
        example: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-13T17:01:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-13T17:05:00.000Z',
      },
    },
  },

  PickupLogListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          docs: {
            type: 'array',
            items: { $ref: '#/components/schemas/PickupLogItem' },
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

  PickupLogFiltro: {
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
      authorization_id: {
        type: 'string',
        description: 'Filtrar por autorizacao de retirada',
        example: '664cfd005060708090101001',
      },
      verified_by: {
        type: 'string',
        description: 'Filtrar por usuario verificador',
        example: '6643b4a8c5d6e7f809102001',
      },
      method: {
        type: 'string',
        description: 'Filtrar por metodo de retirada',
        example: 'manual',
      },
      active: {
        type: 'boolean',
        description: 'Filtrar por ativo',
        example: true,
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        description: 'Data inicial de retirada (departure_time)',
        example: '2026-04-01T00:00:00.000Z',
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        description: 'Data final de retirada (departure_time)',
        example: '2026-04-30T23:59:59.000Z',
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

export default pickupLogSchemas;
