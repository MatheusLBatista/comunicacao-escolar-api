import usuariosSchemas from '../schemas/usuariosSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const usuariosRoutes = {
  '/users': {
    post: {
      tags: ['Usuários'],
      summary: 'Cria um novo usuário admin global',
      description: `
            + Caso de uso: Criação de novo usuário admin sem vínculo inicial com escola.
            
            + Regras de Negócio:
                - Validação de campos obrigatórios (nome, email, password).  
                - Verificação de unicidade para email.  
                - Campo password é removido da resposta por segurança.

            + Resultado Esperado:
                - HTTP 201 Created com dados do usuário.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UsuarioPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/UsuarioDetalhes'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        409: commonResponses[409](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
  '/schools/{schoolId}/users': {
    get: {
      tags: ['Usuários'],
      summary: 'Lista usuários de uma escola',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } },
        ...generateParameters(usuariosSchemas.UsuarioFiltro)
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/UsuarioListagem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
      },
    },
    post: {
      tags: ['Usuários'],
      summary: 'Criar novo usuário diretamente na escola',
      description: `
        + Caso de uso: Criar um usuário e já vinculá-lo a uma escola com uma role específica.
        
        + Regras de Negócio:
            - Se o email já existir globalmente e não estiver na escola, anexa o membership.
            - Se já estiver na escola, retorna 409 Conflict.
            - Se não existir, cria o usuário com uma senha temporária (se não enviada).
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['full_name', 'email', 'role'],
              properties: {
                full_name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'] },
                password: { type: 'string' },
                class_id: { type: 'string', description: 'Obrigatório para student' },
                associated_students: { type: 'array', items: { type: 'string' }, description: 'Para parent' }
              }
            }
          }
        }
      },
      responses: { 201: commonResponses[201]('#/components/schemas/UsuarioDetalhes'), 409: commonResponses[409]() }
    }
  },
  '/schools/{schoolId}/members': {
    post: {
      tags: ['Usuários'],
      summary: 'Vincular usuário existente à escola',
      description: `
        + Caso de uso: Vincular um usuário já cadastrado a uma nova escola.
        
        + Fluxo Especial (Cascading):
            - Se a role for 'parent', o sistema exige dados de um 'student' no payload.
            - Cria automaticamente o aluno e o vincula ao pai nesta escola.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                email: { type: 'string', description: 'Email do usuário existente' },
                user_id: { type: 'string', description: 'Ou ID do usuário' },
                role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'] },
                student: {
                  type: 'object',
                  description: 'Obrigatório se role=parent',
                  properties: {
                    full_name: { type: 'string' },
                    class_id: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      responses: { 201: commonResponses[201]('#/components/schemas/UsuarioDetalhes'), 409: commonResponses[409](), 404: commonResponses[404]() }
    }
  },
  '/schools/{schoolId}/members/{userId}/students': {
    post: {
      tags: ['Usuários'],
      summary: 'Adicionar novo filho (aluno) a um responsável',
      description: `
        + Caso de uso: Adicionar um novo aluno a um pai já vinculado à escola.
        + Regras: Cria o aluno e atualiza o array associated_students do pai.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['full_name', 'class_id'],
              properties: {
                full_name: { type: 'string' },
                class_id: { type: 'string' }
              }
            }
          }
        }
      },
      responses: { 201: commonResponses[201]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404]() }
    }
  },
  '/users/{id}': {
    get: {
      tags: ['Usuários'],
      summary: 'Obtém detalhes de um usuário',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404]() },
    },
    patch: {
      tags: ['Usuários'],
      summary: 'Atualiza um usuário',
      description: 'Campos email e password são ignorados no update.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioPutPatch' } } } },
      responses: { 200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404]() },
    },
    delete: {
      tags: ['Usuários'],
      summary: 'Deleta (desativa) um usuário',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Usuário desativado com sucesso.' }
                }
              }
            }
          }
        },
        404: commonResponses[404]()
      },
    },
  },
  '/users/{id}/foto': {
    put: {
      tags: ['Usuários'],
      summary: 'Faz upload da foto do usuário',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } }
            }
          }
        }
      },
      responses: { 201: commonResponses[201]('#/components/schemas/UsuarioUploadFotoResposta') },
    },
    delete: {
      tags: ['Usuários'],
      summary: 'Deleta a foto do usuário',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: commonResponses[200]() },
    },
  },
};

export default usuariosRoutes;
