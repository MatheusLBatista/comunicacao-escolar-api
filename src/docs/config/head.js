import authSchemas from '../schemas/authSchema.js';
import usuariosSchemas from '../schemas/usuariosSchema.js';
import gruposSchemas from '../schemas/grupoSchema.js';
import rotasSchemas from '../schemas/rotaSchema.js';
import conversationSchemas from '../schemas/conversationSchema.js';
import postSchemas from '../schemas/postSchema.js';
import eventSchemas from '../schemas/eventSchema.js';
import schoolSchemas from '../schemas/schoolSchema.js';
import pickupAuthorizationSchemas from '../schemas/pickupAuthorizationSchema.js';
import pickupLogSchemas from '../schemas/pickupLogSchema.js';
import likeSchemas from '../schemas/likeSchema.js';
import classSchemas from '../schemas/classSchema.js';
import auditLogSchemas from '../schemas/auditLogSchema.js';
import dailyLogSchemas from '../schemas/dailyLogSchema.js';
import dailyLogTemplateSchemas from '../schemas/dailyLogTemplateSchema.js';
import usuariosPaths from '../paths/usuarios.js';
import authPaths from '../paths/auth.js';
import gruposPaths from '../paths/grupo.js';
import rotasPaths from '../paths/rota.js';
import conversationPaths from '../paths/conversation.js';
import postPaths from '../paths/post.js';
import pickupAuthorizationPaths from '../paths/pickupAuthorization.js';
import pickupLogPaths from '../paths/pickupLog.js';
import eventPaths from '../paths/event.js';
import schoolPaths from '../paths/school.js';
import likePaths from '../paths/like.js';
import classPaths from '../paths/class.js';
import auditLogPaths from '../paths/auditLog.js';
import dailyLogPaths from '../paths/dailyLog.js';
import dailyLogTemplatePaths from '../paths/dailyLogTemplate.js';
import mePaths from '../paths/me.js';

// Função para definir as URLs do servidor dependendo do ambiente
const getServersInCorrectOrder = () => {
  const PORT = process.env.PORT;
  const servers = [];

  if (process.env.NODE_ENV !== 'production') {
    servers.push({ url: `http://localhost:${PORT}`, description: 'Local' });
  }

  if (process.env.API_URL) {
    servers.push({ url: process.env.API_URL, description: 'Produção' });
  }

  if (servers.length === 0) {
    servers.push({ url: `http://localhost:${PORT}`, description: 'Local' });
  }

  return servers;
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
          'API para gestão de comunicação escolar \n\nÉ necessário autenticar com token JWT antes de utilizar a maioria das rotas. Faça isso na rota /auth/login com um email e senha válido. Esta API conta com refresh token, que pode ser obtido na rota /auth/refresh, e com logout, que pode ser feito na rota /auth/logout. Para revogação de acesso use a rota /auth/revoke. Para mais informações, acesse a documentação.',
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
          description: 'Rotas para relatórios diários e templates',
        },
        {
          name: 'Conversas',
          description: 'Rotas para chat entre usuários',
        },
        {
          name: 'Eventos',
          description: 'Rotas para gestão de eventos escolares',
        },
        {
          name: 'Turmas',
          description: 'Rotas para gestão de turmas',
        },
        {
          name: 'Autorizações de Retirada',
          description: 'Rotas para gerenciamento de autorizações de retirada',
        },
        {
          name: 'Logs de Retirada',
          description: 'Rotas para registro e auditoria de retirada de alunos',
        },
        {
          name: 'Likes',
          description: 'Rotas para gerenciar likes em comunicados',
        },
        {
          name: 'Audit Log',
          description: 'Rotas para consulta de logs de auditoria do sistema',
        },
        {
          name: 'Me',
          description: 'Rotas do perfil do usuário autenticado',
        },
      ],
      paths: {
        ...authPaths,
        ...mePaths,
        ...usuariosPaths,
        ...gruposPaths,
        ...rotasPaths,
        ...conversationPaths,
        ...postPaths,
        ...pickupAuthorizationPaths,
        ...pickupLogPaths,
        ...eventPaths,
        ...schoolPaths,
        ...likePaths,
        ...classPaths,
        ...auditLogPaths,
        ...dailyLogPaths,
        ...dailyLogTemplatePaths,
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
          ...pickupLogSchemas,
          ...eventSchemas,
          ...schoolSchemas,
          ...likeSchemas,
          ...classSchemas,
          ...auditLogSchemas,
          ...dailyLogSchemas,
          ...dailyLogTemplateSchemas,
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
