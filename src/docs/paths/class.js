import classSchemas from '../schemas/classSchema.js';
import commonResponses from '../schemas/swaggerCommonResponses.js';

const classPaths = {
  '/schools/{schoolId}/class': {
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
};

export default classPaths;
