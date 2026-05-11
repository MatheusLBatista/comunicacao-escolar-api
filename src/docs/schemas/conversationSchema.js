const conversationSchemas = {
  ConversationPost: {
    type: 'object',
    required: ['participant_id'],
    properties: {
      participant_id: {
        type: 'string',
        description: 'ObjectId do participante com quem se quer conversar',
        example: '6644c5b9d6e7f80910203002',
      },
      type: {
        type: 'string',
        enum: ['private', 'daily_log_reply'],
        default: 'private',
        description: 'Tipo da conversa',
        example: 'private',
      },
    },
  },

  ConversationItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      school_id: { type: 'string', example: '6642a3f7b4c5d6e7f8091001' },
      participants: {
        type: 'array',
        items: { type: 'string' },
        example: ['664f1b2c3a9d4e0012345679', '664f1b2c3a9d4e001234567a'],
      },
      type: {
        type: 'string',
        enum: ['private', 'daily_log_reply'],
        example: 'private',
      },
      last_message_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-06-01T10:00:00.000Z',
      },
      active: { type: 'boolean', example: true },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T09:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T10:00:00.000Z',
      },
    },
  },

  ConversationListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/ConversationItem' },
      },
      totalDocs: { type: 'number', example: 5 },
      limit: { type: 'number', example: 20 },
      totalPages: { type: 'number', example: 1 },
      page: { type: 'number', example: 1 },
      hasPrevPage: { type: 'boolean', example: false },
      hasNextPage: { type: 'boolean', example: false },
      prevPage: { type: 'number', nullable: true, example: null },
      nextPage: { type: 'number', nullable: true, example: null },
    },
  },

  MessagePost: {
    type: 'object',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        description: 'Conteúdo da mensagem',
        example: 'Olá! Gostaria de conversar sobre o desempenho do seu filho.',
      },
    },
  },

  MessageItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345680' },
      conversation_id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      sender_id: { type: 'string', example: '664f1b2c3a9d4e0012345679' },
      text: {
        type: 'string',
        example: 'Olá! Gostaria de conversar sobre o desempenho do seu filho.',
      },
      read_by: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: '664f1b2c3a9d4e001234567a' },
            at: {
              type: 'string',
              format: 'date-time',
              example: '2024-06-01T10:05:00.000Z',
            },
          },
        },
      },
      sent_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T10:00:00.000Z',
      },
      active: { type: 'boolean', example: true },
    },
  },

  MessageListagem: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/MessageItem' },
      },
      totalDocs: { type: 'number', example: 10 },
      limit: { type: 'number', example: 20 },
      totalPages: { type: 'number', example: 1 },
      page: { type: 'number', example: 1 },
      hasPrevPage: { type: 'boolean', example: false },
      hasNextPage: { type: 'boolean', example: false },
      prevPage: { type: 'number', nullable: true, example: null },
      nextPage: { type: 'number', nullable: true, example: null },
    },
  },
};

export default conversationSchemas;
