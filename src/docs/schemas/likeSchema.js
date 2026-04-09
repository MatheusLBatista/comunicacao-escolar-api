const likeSchemas = {
  LikeItem: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '664f1b2c3a9d4e0012345678' },
      post_id: { type: 'string', example: '664f1b2c3a9d4e0012345679' },
      user_id: { type: 'string', example: '000000000000000000000002' },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2026-04-03T12:00:00.000Z',
      },
    },
  },

  LikeRemoved: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Like removido com sucesso.',
      },
    },
  },
};

export default likeSchemas;
