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
        { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' },
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
      parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['full_name', 'email', 'role'],
              properties: {
                full_name: { type: 'string', example: 'Carlos Alves' },
                email: { type: 'string', example: 'carlos.alves@escola.com' },
                role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'], example: 'teacher' },
                password: { type: 'string', example: 'Senha@123' },
                class_id: { type: 'string', description: 'Obrigatório para student', example: '6647f8ec0910203040506001', nullable: true },
                associated_students: { type: 'array', items: { type: 'string' }, description: 'Para parent', example: [] }
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
      parameters: [{ name: 'schoolId', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                email: { type: 'string', description: 'Email do usuário existente', example: 'maria.teacher@escola.com' },
                user_id: { type: 'string', description: 'Ou ID do usuário (alternativa ao email)', example: '6644c5b9d6e7f80910203002' },
                role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'], example: 'teacher' },
                student: {
                  type: 'object',
                  description: 'Obrigatório se role=parent',
                  properties: {
                    full_name: { type: 'string', example: 'João Silva' },
                    class_id: { type: 'string', description: 'ID da turma (opcional)', example: '6647f8ec0910203040506001', nullable: true }
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
  '/schools/{schoolId}/members/{userId}': {
    patch: {
      tags: ['Usuários'],
      summary: 'Atualizar papel (role) do membro na escola',
      description: `
        + Caso de uso: Alterar a role de um usuário já vinculado à escola.
        + Regras: O usuário deve ser membro da escola. A nova role deve ser válida.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, example: '6644c5b9d6e7f80910203002' }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: { type: 'string', enum: ['admin', 'teacher', 'parent', 'student'], example: 'teacher' }
              }
            }
          }
        }
      },
      responses: { 200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404](), 409: commonResponses[409]() }
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
        { name: 'schoolId', in: 'path', required: true, schema: { type: 'string' }, example: '6642a3f7b4c5d6e7f8091001' },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, example: '6645d6cae7f8091020304003' }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['full_name'],
              properties: {
                full_name: { type: 'string', example: 'Lucas Silva' },
                class_id: { type: 'string', description: 'ID da turma (opcional)', example: '6647f8ec0910203040506001', nullable: true }
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
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '6643b4a8c5d6e7f809102001' }],
      responses: { 200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404]() },
    },
    patch: {
      tags: ['Usuários'],
      summary: 'Atualiza um usuário',
      description: 'Campos email e password são ignorados no update.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '6643b4a8c5d6e7f809102001' }],
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioPutPatch' } } } },
      responses: { 200: commonResponses[200]('#/components/schemas/UsuarioDetalhes'), 404: commonResponses[404]() },
    },
    delete: {
      tags: ['Usuários'],
      summary: 'Deleta (desativa) um usuário',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '6643b4a8c5d6e7f809102001' }],
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
};

export default usuariosRoutes;
