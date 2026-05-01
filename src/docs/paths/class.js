import classSchemas from '../schemas/classSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const classPaths = {
  '/schools/{schoolId}/class': {
    get: {
      tags: ['Turmas'],
      summary: 'Listar turmas da escola',
      description: `
            + Caso de uso: Listar turmas vinculadas a uma escola com filtros opcionais.

            + Funcao de Negocio:
                - Retornar lista paginada de turmas da escola informada.
                - Permitir filtros por nome, serie/grau, ano, professor e status.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de turmas.
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
        ...generateParameters(classSchemas.ClassFiltro),
      ],
      responses: {
        200: {
          description: 'Lista de turmas retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClassListagem',
              },
            },
          },
        },
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
    post: {
      tags: ['Turmas'],
      summary: 'Criar turma',
      description: `
            + Caso de uso: Criar uma nova turma vinculada a uma escola.

            + Funcao de Negocio:
                - Permitir que usuarios autenticados e autorizados criem turmas.
                - O schoolId e extraido da URL e nao precisa ser enviado no corpo.

            + Regras de Negocio:
                - A escola (schoolId) deve existir.
                - name, grade, year e teacher_ids sao obrigatorios.
                - teacher_ids deve conter professores validos.
                - Nao permite duplicidade de turma por (school_id, name, grade).

            + Resultado Esperado:
                - HTTP 201 Created com dados da turma criada.
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
              $ref: '#/components/schemas/ClassPost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/ClassItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        409: commonResponses[409](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },

  '/schools/{schoolId}/class/{id}': {
    get: {
      tags: ['Turmas'],
      summary: 'Buscar turma por ID',
      description: `
            + Caso de uso: Buscar uma turma especifica pelo identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes da turma.
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
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID da turma',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/ClassItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
    patch: {
      tags: ['Turmas'],
      summary: 'Atualizar turma parcialmente',
      description: `
            + Caso de uso: Atualizar parcialmente os dados de uma turma existente.

            + Regras de Negocio:
                - A turma deve existir.
                - teacher_ids deve conter professores validos quando informado.
                - Nao permite duplicidade por (school_id, name, grade, year).

            + Resultado Esperado:
                - HTTP 200 OK com os dados atualizados da turma.
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
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID da turma',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ClassPatch',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/ClassItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        403: commonResponses[403](),
        404: commonResponses[404](),
        409: commonResponses[409](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default classPaths;
