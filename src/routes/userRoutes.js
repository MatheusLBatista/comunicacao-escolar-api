import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import UserController from '../controllers/UserController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const userController = new UserController();

router
  .post(
    '/users',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.createAdmin.bind(userController)),
  )
  .post(
    '/schools/:schoolId/members',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.linkToSchool.bind(userController)),
  )
  .post(
    '/schools/:schoolId/members/:userId/students',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.addStudentToParent.bind(userController)),
  )
  .post(
    '/schools/:schoolId/users',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.createAtSchool.bind(userController)),
  )
  .get(
    '/schools/:schoolId/users',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.listBySchool.bind(userController)),
  )
  .get(
    '/users/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.getById.bind(userController)),
  )
  .patch(
    '/users/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.update.bind(userController)),
  )
  .delete(
    '/users/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(userController.delete.bind(userController)),
  );

export default router;
