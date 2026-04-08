import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import getSwaggerOptions from '../docs/config/head.js';
import logRoutes from '../middlewares/LogRoutesMiddleware.js';
import auth from './authRoutes.js';
import like from './likeRoutes.js'
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

import dotenv from 'dotenv';

dotenv.config();

const routes = (app) => {
  if (process.env.DEBUGLOG) {
    app.use(logRoutes);
  }

  app.get('/', (req, res) => {
    res.redirect('/docs');
  });

  const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
  app.use(swaggerUI.serve);
  app.get('/docs', (req, res, next) => {
    swaggerUI.setup(swaggerDocs)(req, res, next);
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
  );

  app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });
};

export default routes;
