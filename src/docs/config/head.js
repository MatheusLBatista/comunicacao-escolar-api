import authSchemas from '../schemas/authSchema.js';
import usuariosSchemas from '../schemas/usuariosSchema.js';
import gruposSchemas from '../schemas/grupoSchema.js';
import rotasSchemas from '../schemas/rotaSchema.js';
import conversationSchemas from '../schemas/conversationSchema.js';
import postSchemas from '../schemas/postSchema.js';
import pickupAuthorizationSchemas from '../schemas/pickupAuthorizationSchema.js';
import usuariosPaths from '../paths/usuarios.js';
import authPaths from '../paths/auth.js';
import gruposPaths from '../paths/grupo.js';
import rotasPaths from '../paths/rota.js';
import conversationPaths from '../paths/conversation.js';
import postPaths from '../paths/post.js';
import pickupAuthorizationPaths from '../paths/pickupAuthorization.js';

// Função para definir as URLs do servidor dependendo do ambiente
const getServersInCorrectOrder = () => {
  const PORT = process.env.PORT;
  const devUrl = {
    url: process.env.SWAGGER_DEV_URL || `http://localhost:${PORT}`,
  };

  if (process.env.NODE_ENV === 'production') return [devUrl];
  else return [devUrl];
};

// Função para obter as opções do Swagger
const getSwaggerOptions = () => {
  return {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'API Comunicação Escolar',
        version: '1.0.0',
        description:
          'API para gestão de comunicação escolar \n\nÉ necessário autenticar com token JWT antes de utilizar a maioria das rotas. Faça isso na rota /login com um email e senha válido. Esta API conta com refresh token, que pode ser obtido na rota /refresh, e com logout, que pode ser feito na rota /logout. Para revogação de acesso use a rota /revoke. Para mais informações, acesse a documentação.',
        contact: {
          name: 'Equipe de Desenvolvimento',
          email: 'dev@comunicacao-escolar.com',
        },
      },
      servers: getServersInCorrectOrder(),
      tags: [
        {
          name: 'Auth',
          description: 'Rotas para autenticação e autorização',
        },
        {
          name: 'Usuários',
          description: 'Rotas para gestão de usuários',
        },
        {
          name: 'Grupos',
          description: 'Rotas para gestão de grupos e permissões',
        },
        {
          name: 'Rotas',
          description: 'Rotas para gestão de rotas de acesso do sistema',
        },
        {
          name: 'Escolas',
          description: 'Rotas para gestão de escolas',
        },
        {
          name: 'Comunicados',
          description: 'Rotas para gestão de comunicados (mural)',
        },
        {
          name: 'Rotina Diária',
          description: 'Rotas para relatórios diários dos alunos',
        },
        {
          name: 'Conversas',
          description: 'Rotas para chat entre usuários',
        },
        {
          name: 'Autorizações de Retirada',
          description:
            'Rotas para gestão de autorizações de retirada de alunos',
        },
      ],
      paths: {
        ...authPaths,
        ...usuariosPaths,
        ...gruposPaths,
        ...rotasPaths,
        ...conversationPaths,
        ...postPaths,
        ...pickupAuthorizationPaths,
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          ...authSchemas,
          ...usuariosSchemas,
          ...gruposSchemas,
          ...rotasSchemas,
          ...conversationSchemas,
          ...postSchemas,
          ...pickupAuthorizationSchemas,
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ['./src/routes/*.js'],
  };
};

export default getSwaggerOptions;
