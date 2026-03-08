import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import SchoolController from '../controllers/SchoolController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const schoolController = new SchoolController();

router
  .get(
    '/schools',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.list.bind(schoolController)),
  )
  .get(
    '/schools/:id',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.list.bind(schoolController)),
  )
  .post(
    '/schools',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.create.bind(schoolController)),
  )
  .patch(
    '/schools/:id',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.update.bind(schoolController)),
  )
  .put(
    '/schools/:id',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.update.bind(schoolController)),
  )
  .delete(
    '/schools/:id',
    // AuthMiddleware,
    // AuthPermission,
    asyncWrapper(schoolController.delete.bind(schoolController)),
  );

export default router;
