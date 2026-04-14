import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import getSwaggerOptions from '../docs/config/head.js';
import logRoutes from '../middlewares/LogRoutesMiddleware.js';
import auth from './authRoutes.js';
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

  app.get('/', (req, res) => {
    res.redirect('/docs');
  });

  const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
  const swaggerUIHandler = swaggerUI.setup(swaggerDocs, {
    explorer: true,
  });

  app.get('/docs.json', allowSwaggerUI, (req, res) => {
    res.json(swaggerDocs);
  });

  app.use('/docs', allowSwaggerUI, swaggerUI.serve);
  app.get('/docs', allowSwaggerUI, swaggerUIHandler);

  app.get('/api-docs', (req, res) => {
    res.redirect('/docs');
  });

  app.use(
    express.json(),
    auth,
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
  );

  app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });
};

export default routes;
