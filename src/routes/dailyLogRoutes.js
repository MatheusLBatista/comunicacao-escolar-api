import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import DailyLogController from '../controllers/DailyLogController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const dailyLogController = new DailyLogController();

router
  .get(
    '/daily-logs',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.list.bind(dailyLogController)),
  )
  .get(
    '/daily-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.list.bind(dailyLogController)),
  )
  .post(
    '/daily-logs',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.create.bind(dailyLogController)),
  )
  .patch(
    '/daily-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.update.bind(dailyLogController)),
  )
  .put(
    '/daily-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.update.bind(dailyLogController)),
  )
  .patch(
    '/daily-logs/:id/read',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.markAsRead.bind(dailyLogController)),
  )
  .delete(
    '/daily-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(dailyLogController.delete.bind(dailyLogController)),
  );

export default router;
