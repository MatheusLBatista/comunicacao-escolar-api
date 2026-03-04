import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import RotaController from '../controllers/RotaController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const rotaController = new RotaController();

router
  .get(
    '/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.list.bind(rotaController)),
  )
  .get(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.list.bind(rotaController)),
  )
  .post(
    '/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.create.bind(rotaController)),
  )
  .patch(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.update.bind(rotaController)),
  )
  .put(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.update.bind(rotaController)),
  )
  .delete(
    '/rotas/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(rotaController.delete.bind(rotaController)),
  );

export default router;
