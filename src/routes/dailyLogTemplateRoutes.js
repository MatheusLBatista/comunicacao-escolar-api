import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import DailyLogTemplateController from '../controllers/DailyLogTemplateController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const dailyLogTemplateController = new DailyLogTemplateController();

router
  .get(
    '/daily-log-templates',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.list.bind(dailyLogTemplateController),
    ),
  )
  .get(
    '/daily-log-templates/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.list.bind(dailyLogTemplateController),
    ),
  )
  .post(
    '/daily-log-templates',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.create.bind(dailyLogTemplateController),
    ),
  )
  .patch(
    '/daily-log-templates/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.update.bind(dailyLogTemplateController),
    ),
  )
  .put(
    '/daily-log-templates/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.update.bind(dailyLogTemplateController),
    ),
  )
  .delete(
    '/daily-log-templates/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      dailyLogTemplateController.delete.bind(dailyLogTemplateController),
    ),
  );

export default router;
