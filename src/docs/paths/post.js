import postSchemas from '../schemas/postSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const postPaths = {
  '/schools/{schoolId}/posts': {
    post: {
      tags: ['Comunicados'],
      summary: 'Criar comunicado',
      description: `
            + Caso de uso: Criar um novo comunicado no mural da escola.

            + Função de Negócio:
                - Permitir que usuários autenticados autorizados criem comunicados na escola.
                - O autor é definido automaticamente pelo token da sessão.
                - O school_id é extraído da URL e não precisa ser enviado no corpo da requisição.

            + Regras de Negócio:
                - A escola (schoolId) deve existir.
                - Se target.scope for diferente de "all" (ex: "class"), target_id é obrigatório.
                - Quando informado, target_id deve corresponder a uma turma existente da mesma escola validada.

            + Resultado Esperado:
                - HTTP 201 Created com dados do comunicado criado.
                - HTTP 422 Unprocessable Entity caso target_id seja ausente para scope != "all" ou a turma não exista.
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
            schema: {
              $ref: '#/components/schemas/PostPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Comunicados'],
      summary: 'Listar comunicados da escola',
      description: `
            + Caso de uso: Listar comunicados do mural da escola com filtros opcionais.

            + Função de Negócio:
                - Retornar lista paginada de comunicados da escola especificada.
                - Permitir filtros por autor, conteúdo e target.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de comunicados.
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
        ...generateParameters(postSchemas.PostFiltro),
      ],
      responses: {
        200: {
          description: 'Lista de comunicados retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PostListagem',
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

  '/posts/{id}': {
    get: {
      tags: ['Comunicados'],
      summary: 'Buscar comunicado por ID',
      description: `
            + Caso de uso: Buscar um comunicado específico pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes do comunicado.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID do comunicado',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Comunicados'],
      summary: 'Atualizar comunicado',
      description: `
            + Caso de uso: Atualizar um comunicado existente.

            + Função de Negócio:
                - Permitir que usuários autenticados autorizados atualizem comunicados.
                - Apenas o autor do comunicado ou usuários com permissão podem atualizar.

            + Regras de Negócio:
                - O comunicado deve existir.
                - Todos os campos são opcionais.
                - Se target.scope for diferente de "all" (ex: "class"), target_id é obrigatório.
                - Quando informado, target_id deve corresponder a uma turma existente.

            + Resultado Esperado:
                - HTTP 200 OK com dados do comunicado atualizado.
                - HTTP 422 Unprocessable Entity caso target_id seja ausente para scope != "all" ou a turma não exista.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID do comunicado',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PostPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Comunicados'],
      summary: 'Desativar comunicado',
      description: `
        + Caso de uso: Desativar (soft delete) um comunicado pelo identificador.

            + Função de Negócio:
          - Permitir que usuários autenticados autorizados desativem comunicados.
          - Para usuários comuns, a operação desativa o comunicado (active=false).
          - Para administradores, a exclusão pode ser definitiva conforme regra de repositório.

            + Regras de Negócio:
                - O comunicado deve existir.
          - Apenas o autor ou administradores podem desativar/excluir.

            + Resultado Esperado:
                - HTTP 200 OK com mensagem de sucesso.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID do comunicado',
        },
      ],
      responses: {
        200: commonResponses[200](),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/posts/{id}/attachments': {
    post: {
      tags: ['Comunicados'],
      summary: 'Adicionar anexos ao comunicado',
      description: `
            + Caso de uso: Fazer upload de um ou mais anexos de imagem para um comunicado.

            + Função de Negócio:
                - Receber arquivos via multipart/form-data no campo 'files'.
                - Comprimir imagem e armazenar no MinIO.
                - Registrar nome do objeto em attachments do comunicado.

            + Regras de Negócio:
                - O comunicado deve existir.
                - Deve ser enviado ao menos um arquivo.
                - Máximo de 10 arquivos por requisição.
                - Limite de 10 MB por arquivo.

            + Resultado Esperado:
                - HTTP 201 Created com o comunicado atualizado.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID do comunicado',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['files'],
              properties: {
                files: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                  description: 'Arquivos de imagem para anexo (máx. 10 arquivos)',
                },
              },
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        413: commonResponses[413](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/posts/{postId}/attachments/{linkId}': {
    delete: {
      tags: ['Comunicados'],
      summary: 'Remover anexo do comunicado',
      description: `
            + Caso de uso: Remover um anexo de um comunicado específico.

            + Função de Negócio:
                - Remove o link do anexo na entidade de comunicado.
                - Remove o objeto correspondente no armazenamento de arquivos.

            + Regras de Negócio:
                - O comunicado deve existir.
                - O anexo informado deve existir no comunicado.

            + Resultado Esperado:
                - HTTP 200 OK com o comunicado atualizado.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'postId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID do comunicado',
        },
        {
          name: 'linkId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Identificador do arquivo/anexo no storage',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/PostItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/attachments/{id}': {
    get: {
      tags: ['Comunicados'],
      summary: 'Baixar anexo por ID',
      description: `
            + Caso de uso: Recuperar o conteúdo binário de um anexo armazenado.

            + Função de Negócio:
                - Buscar objeto no storage pelo identificador do arquivo.
                - Retornar o binário com content-type original.

            + Resultado Esperado:
                - HTTP 200 OK com arquivo em stream/binário.
            `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Identificador do arquivo/anexo no storage',
        },
      ],
      responses: {
        200: {
          description: 'Arquivo retornado com sucesso',
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default postPaths;
