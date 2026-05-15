import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import getSwaggerOptions from '../docs/config/head.js';
import logRoutes from '../middlewares/LogRoutesMiddleware.js';
import auth from './authRoutes.js';
import me from './meRoutes.js';
import like from './likeRoutes.js';
import users from './userRoutes.js';
import grupos from './groupRoutes.js';
import rotas from './routeRoutes.js';
import school from './schoolRoutes.js';
import post from './postRoutes.js';
import dailyLog from './dailyLogRoutes.js';
import dailyLogTemplate from './dailyLogTemplateRoutes.js';
import event from './eventRoutes.js';
import conversation from './conversationRoutes.js';
import pickupAuthorization from './pickupAuthorizationRoutes.js';
import pickupLog from './pickupLogRoutes.js';
import auditLog from './auditLogRoutes.js';
import turma from './classRoutes.js';

import dotenv from 'dotenv';

dotenv.config();

const routes = (app) => {
  if (process.env.DEBUGLOG) {
    app.use(logRoutes);
  }

  const allowSwaggerUI = (req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Cross-Origin-Embedder-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
    next();
  };

  const swaggerBasicAuth = (req, res, next) => {
    const swaggerUser = process.env.SWAGGER_USER;
    const swaggerPass = process.env.SWAGGER_PASSWORD;

    // Se não configurado, bloqueia em produção
    if (!swaggerUser || !swaggerPass) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).send('Not found');
      }
      return next();
    }

    const authHeader = req.headers.authorization || '';
    const [scheme, encoded] = authHeader.split(' ');

    if (scheme !== 'Basic' || !encoded) {
      res.set('WWW-Authenticate', 'Basic realm="API Docs"');
      return res
        .status(401)
        .send('Autenticação necessária para acessar a documentação.');
    }

    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    if (user !== swaggerUser || pass !== swaggerPass) {
      res.set('WWW-Authenticate', 'Basic realm="API Docs"');
      return res.status(401).send('Credenciais inválidas.');
    }

    next();
  };

  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
  const swaggerUIHandler = swaggerUI.setup(swaggerDocs, {
    explorer: true,
    swaggerOptions: {
      operationsSorter: (a, b) => {
        const isDeleteA = a.get('method') === 'delete';
        const isDeleteB = b.get('method') === 'delete';
        if (isDeleteA && !isDeleteB) return 1;
        if (!isDeleteA && isDeleteB) return -1;
        return 0;
      },
    },
  });

  app.get('/docs.json', swaggerBasicAuth, allowSwaggerUI, (req, res) => {
    res.json(swaggerDocs);
  });

  app.use('/docs', swaggerBasicAuth, allowSwaggerUI, swaggerUI.serve);
  app.get('/docs', swaggerBasicAuth, allowSwaggerUI, swaggerUIHandler);

  app.get('/api-docs', swaggerBasicAuth, (req, res) => {
    res.redirect('/docs');
  });

  app.use(express.json());

  app.use('/auth', auth);

  app.use(
    me,
    users,
    grupos,
    rotas,
    school,
    post,
    dailyLog,
    dailyLogTemplate,
    event,
    conversation,
    pickupAuthorization,
    pickupLog,
    auditLog,
    like,
    turma,
  );

  app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });
};

export default routes;
