import commonResponses from '../schemas/swaggerCommonResponses.js';

const mePaths = {
  '/me': {
    get: {
      tags: ['Me'],
      summary: 'Obter dados do usuário autenticado',
      description: `
            + **Caso de uso**: Retornar os dados do próprio usuário autenticado.

            + **Função de Negócio**:
                - Retorna os dados completos do usuário identificado pelo token JWT.
                - Inclui vínculos com escolas (memberships) e dados de perfil.

            + **Resultado Esperado**:
                - HTTP 200 OK com os dados do usuário autenticado.
            `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
    patch: {
      tags: ['Me'],
      summary: 'Atualizar dados do próprio perfil',
      description: `
            + **Caso de uso**: Atualizar dados do próprio usuário autenticado.

            + **Função de Negócio**:
                - Permite ao usuário atualizar seus próprios dados de perfil.
                - Campos email e password são ignorados nesta operação.

            + **Resultado Esperado**:
                - HTTP 200 OK com os dados atualizados do usuário.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                full_name: {
                  type: 'string',
                  description: 'Nome completo do usuário',
                  minLength: 3,
                  example: 'João Silva',
                },
                avatar_url: {
                  type: 'string',
                  description: 'URL do avatar do usuário',
                  example: 'https://example.com/avatar.jpg',
                },
              },
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/me/password': {
    patch: {
      tags: ['Me'],
      summary: 'Alterar senha do usuário autenticado',
      description: `
            + **Caso de uso**: Alterar a própria senha estando autenticado.

            + **Função de Negócio**:
                - Valida a senha atual antes de permitir a troca.
                - Atualiza a senha com o novo valor fornecido.

            + **Regras de Negócio**:
                - A nova senha deve atender aos critérios de complexidade.
                - Requer autenticação via Bearer token.

            + **Resultado Esperado**:
                - HTTP 200 OK com confirmação de atualização.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['current_password', 'new_password'],
              properties: {
                current_password: {
                  type: 'string',
                  description: 'Senha atual do usuário',
                  example: 'Senha@123',
                },
                new_password: {
                  type: 'string',
                  description: 'Nova senha (mínimo 8 caracteres, com maiúscula, minúscula, número e especial)',
                  minLength: 8,
                  example: 'NovaSenha@456',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Senha alterada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Senha alterada com sucesso.' },
                  errors: { type: 'array', example: [] },
                },
              },
            },
          },
        },
        400: commonResponses[400](),
        401: commonResponses[401](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default mePaths;
