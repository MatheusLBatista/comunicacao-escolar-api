import commonResponses from '../schemas/swaggerCommonResponses.js';

const conversationPaths = {
  '/schools/{schoolId}/conversations': {
    post: {
      tags: ['Conversas'],
      summary: 'Criar ou buscar conversa',
      description: `
+ Caso de uso: Iniciar uma conversa privada entre dois usuários da mesma escola.

+ Função de Negócio:
    - Se já existir uma conversa ativa entre os dois participantes na escola, retorna a existente (200).
    - Caso contrário, cria uma nova conversa e retorna com (201).
    + Recebe no corpo da requisição:
        - **participant_id**: ObjectId do outro participante.
        - **type** (opcional): \`private\` (padrão) ou \`daily_log_reply\`.

+ Regras de Negócio:
    - O usuário autenticado é automaticamente incluído como participante.
    - Um usuário não pode iniciar conversa consigo mesmo.
    - A escola deve existir e o usuário deve ter acesso a ela.

+ Resultado Esperado:
    - HTTP 201 Created (nova conversa) ou 200 OK (conversa já existente) com schema **ConversationItem**.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'schoolId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da escola',
          example: '000000000000000000000001',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ConversationPost' },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/ConversationItem'),
        201: commonResponses[201]('#/components/schemas/ConversationItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Conversas'],
      summary: 'Listar conversas do usuário na escola',
      description: `
+ Caso de uso: Listar todas as conversas em que o usuário autenticado é participante dentro de uma escola.

+ Função de Negócio:
    - Retorna lista paginada de conversas, ordenadas pela mensagem mais recente.
    + Filtros opcionais via query params:
        - **type**: \`private\` ou \`daily_log_reply\`.
        - **page** e **limit**: paginação.

+ Resultado Esperado:
    - HTTP 200 OK com schema **ConversationListagem**.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'schoolId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da escola',
          example: '000000000000000000000001',
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['private', 'daily_log_reply'] },
          description: 'Filtrar por tipo de conversa',
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, example: 1 },
          description: 'Número da página',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
          description: 'Quantidade de itens por página (máx. 100)',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/ConversationListagem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/conversations/{id}': {
    get: {
      tags: ['Conversas'],
      summary: 'Buscar conversa por ID',
      description: `
+ Caso de uso: Obter os detalhes de uma conversa específica.

+ Regras de Negócio:
    - O usuário autenticado deve ser participante da conversa.

+ Resultado Esperado:
    - HTTP 200 OK com schema **ConversationItem**.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da conversa',
          example: '664f1b2c3a9d4e0012345678',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/ConversationItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/conversations/{conversationId}/messages': {
    post: {
      tags: ['Conversas'],
      summary: 'Enviar mensagem',
      description: `
+ Caso de uso: Enviar uma mensagem em uma conversa existente.

+ Função de Negócio:
    - Cria uma nova mensagem associada à conversa.
    - Atualiza o campo \`last_message_at\` da conversa.
    + Recebe no corpo da requisição:
        - **text**: conteúdo da mensagem (mínimo 1 caractere).

+ Regras de Negócio:
    - O usuário autenticado deve ser participante da conversa.
    - O texto não pode ser vazio.

+ Resultado Esperado:
    - HTTP 201 Created com schema **MessageItem**.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da conversa',
          example: '664f1b2c3a9d4e0012345678',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MessagePost' },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/MessageItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Conversas'],
      summary: 'Listar mensagens da conversa',
      description: `
+ Caso de uso: Obter o histórico de mensagens de uma conversa.

+ Função de Negócio:
    - Retorna lista paginada de mensagens, ordenadas da mais recente para a mais antiga.
    + Filtros opcionais:
        - **page** e **limit**: paginação.

+ Regras de Negócio:
    - O usuário autenticado deve ser participante da conversa.

+ Resultado Esperado:
    - HTTP 200 OK com schema **MessageListagem**.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da conversa',
          example: '664f1b2c3a9d4e0012345678',
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, example: 1 },
          description: 'Número da página',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
          description: 'Quantidade de itens por página (máx. 100)',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/MessageListagem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/conversations/{conversationId}/messages/read': {
    patch: {
      tags: ['Conversas'],
      summary: 'Marcar mensagens como lidas',
      description: `
+ Caso de uso: Marcar todas as mensagens não lidas de uma conversa como lidas para o usuário autenticado.

+ Função de Negócio:
    - Atualiza o campo \`read_by\` nas mensagens que o usuário ainda não leu.

+ Regras de Negócio:
    - O usuário autenticado deve ser participante da conversa.
    - Apenas mensagens enviadas por outros participantes são marcadas.

+ Resultado Esperado:
    - HTTP 200 OK com mensagem de confirmação.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId da conversa',
          example: '664f1b2c3a9d4e0012345678',
        },
      ],
      responses: {
        200: commonResponses[200](),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default conversationPaths;
