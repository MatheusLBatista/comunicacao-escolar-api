import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import RouteController from '../controllers/RouteController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const routeController = new RouteController();

router
  .get(
    '/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.list.bind(rotaController)),
  )
  .get(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.list.bind(rotaController)),
  )
  .post(
    '/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.create.bind(rotaController)),
  )
  .patch(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.update.bind(rotaController)),
  )
  .put(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.update.bind(rotaController)),
  )
  .delete(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.delete.bind(rotaController)),
  );

export default router;
