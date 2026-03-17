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
    asyncWrapper(routeController.list.bind(routeController)),
  )
  .get(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.list.bind(routeController)),
  )
  .post(
    '/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.create.bind(routeController)),
  )
  .patch(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.update.bind(routeController)),
  )
  .put(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.update.bind(routeController)),
  )
  .delete(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(routeController.delete.bind(routeController)),
  );

export default router;
