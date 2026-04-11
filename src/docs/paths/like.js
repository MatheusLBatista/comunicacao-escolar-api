import likeSchemas from '../schemas/likeSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';

const likePaths = {
  '/posts/{id}/like': {
    post: {
      tags: ['Likes'],
      summary: 'Toggle Like em Post',
      description: `
            + Caso de uso: Criar ou remover um like em um comunicado.

            + Função de Negócio:
                - Permitir que usuários autenticados façam like em comunicados.
                - Se o usuário já deu like, ao chamar novamente o like é removido (toggle).
                - O user_id é definido automaticamente pelo token da sessão.

            + Regras de Negócio:
                - O post deve existir.
                - O usuário deve pertencer à mesma escola do post ou ser admin.
                - A permissão do like depende da visibilidade do post para o usuário.
                - Se o post tem target.scope='class', apenas usuários da turma podem dar like.

            + Resultado Esperado:
                - HTTP 200 OK com dados do like criado ou mensagem de remoção.
                - Criação: Retorna objeto com _id, post_id, user_id e created_at.
                - Remoção: Retorna mensagem de sucesso.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ObjectId do comunicado',
          example: '664f1b2c3a9d4e0012345679',
        },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/LikeItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default likePaths;
