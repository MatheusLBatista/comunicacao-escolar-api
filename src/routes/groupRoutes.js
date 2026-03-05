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
    asyncWrapper(groupController.list.bind(groupController)),
  )
  .get(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.list.bind(groupController)),
  )
  .post(
    '/grupos',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.create.bind(groupController)),
  )
  .post(
    '/grupos/:id/rotas',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.addRoute.bind(groupController)),
  )
  .patch(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.update.bind(groupController)),
  )
  .put(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.update.bind(groupController)),
  )
  .delete(
    '/grupos/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(groupController.delete.bind(groupController)),
  );
export default router;
