import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import GroupController from '../controllers/GroupController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const groupController = new GroupController(); // Instância da classe

router
  .get(
    '/grupos',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.list.bind(grupoController)),
  )
  .get(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.list.bind(grupoController)),
  )
  .post(
    '/grupos',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.create.bind(grupoController)),
  )
  .post(
    '/grupos/:id/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.addRoute.bind(grupoController)),
  )
  .patch(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.update.bind(grupoController)),
  )
  .put(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.update.bind(grupoController)),
  )
  .delete(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.delete.bind(grupoController)),
  );
export default router;
