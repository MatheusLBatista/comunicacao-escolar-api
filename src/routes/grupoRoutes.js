import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import GrupoController from '../controllers/GrupoController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const grupoController = new GrupoController(); // Instância da classe

router
  .get(
    '/grupos',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.list.bind(grupoController)),
  )
  .get(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.list.bind(grupoController)),
  )
  .post(
    '/grupos',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.create.bind(grupoController)),
  )
  .post(
    '/grupos/:id/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.addRoute.bind(grupoController)),
  )
  .patch(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.update.bind(grupoController)),
  )
  .put(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.update.bind(grupoController)),
  )
  .delete(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(grupoController.delete.bind(grupoController)),
  );
export default router;
