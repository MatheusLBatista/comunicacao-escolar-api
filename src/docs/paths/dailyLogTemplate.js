import dailyLogTemplateSchemas from '../schemas/dailyLogTemplateSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';
import { generateParameters } from './utils/generateParameters.js';

const dailyLogTemplatePaths = {
  '/daily-log-templates': {
    post: {
      tags: ['Rotina Diária'],
      summary: 'Criar template de rotina diaria',
      description: `
            + Caso de uso: Criar um novo template para preenchimento de diarios.

            + Funcao de Negocio:
                - Permitir que usuarios autenticados e autorizados configurem campos do diario.
                - O template pode ser geral da escola ou especifico de um aluno.

            + Regras de Negocio:
                - school_id deve existir.
                - fields deve possuir ao menos 1 item.
                - Campos do tipo select devem informar options com pelo menos 1 valor.

            + Resultado Esperado:
                - HTTP 201 Created com dados do template criado.
            `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DailyLogTemplatePost',
            },
          },
        },
      },
      responses: {
        201: commonResponses[201]('#/components/schemas/DailyLogTemplateItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    get: {
      tags: ['Rotina Diária'],
      summary: 'Listar templates de rotina diaria',
      description: `
            + Caso de uso: Listar templates com filtros opcionais.

            + Funcao de Negocio:
                - Retornar lista paginada de templates.
                - Permitir filtros por escola, aluno e status ativo.

            + Resultado Esperado:
                - HTTP 200 OK com lista paginada de templates.
            `,
      security: [{ bearerAuth: [] }],
      parameters: generateParameters(
        dailyLogTemplateSchemas.DailyLogTemplateFiltro,
      ),
      responses: {
        200: {
          description: 'Lista de templates retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DailyLogTemplateListagem',
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

  '/daily-log-templates/{id}': {
    get: {
      tags: ['Rotina Diária'],
      summary: 'Buscar template por ID',
      description: `
            + Caso de uso: Buscar um template especifico por identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os detalhes do template.
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
          description: 'ID do template',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogTemplateItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    patch: {
      tags: ['Rotina Diária'],
      summary: 'Atualizar template de rotina diaria',
      description: `
            + Caso de uso: Atualizar parcialmente um template existente.

            + Regras de Negocio:
                - Se school_id for informado, deve existir.
                - Se student_id for informado, deve existir.
                - Campos do tipo select devem informar options com pelo menos 1 valor.

            + Resultado Esperado:
                - HTTP 200 OK com dados atualizados do template.
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
          description: 'ID do template',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DailyLogTemplatePatchPut',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogTemplateItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    put: {
      tags: ['Rotina Diária'],
      summary: 'Substituir template de rotina diaria',
      description: `
            + Caso de uso: Substituir um template existente.

            + Regras de Negocio:
                - Se school_id for informado, deve existir.
                - Se student_id for informado, deve existir.
                - Campos do tipo select devem informar options com pelo menos 1 valor.

            + Resultado Esperado:
                - HTTP 200 OK com dados do template apos atualizacao.
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
          description: 'ID do template',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DailyLogTemplatePatchPut',
            },
          },
        },
      },
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogTemplateItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        422: commonResponses[422](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },

    delete: {
      tags: ['Rotina Diária'],
      summary: 'Excluir template de rotina diaria',
      description: `
            + Caso de uso: Excluir um template por identificador.

            + Resultado Esperado:
                - HTTP 200 OK com os dados do template removido.
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
          description: 'ID do template',
        },
      ],
      responses: {
        200: commonResponses[200]('#/components/schemas/DailyLogTemplateItem'),
        400: commonResponses[400](),
        401: commonResponses[401](),
        404: commonResponses[404](),
        498: commonResponses[498](),
        500: commonResponses[500](),
      },
    },
  },
};

export default dailyLogTemplatePaths;
