import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import PickupLogsController from '../controllers/PickupLogsController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const pickupLogsController = new PickupLogsController();

router
  .post(
    '/pickup-logs',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(pickupLogsController.create.bind(pickupLogsController)),
  )
  .get(
    '/pickup-logs',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(pickupLogsController.list.bind(pickupLogsController)),
  )
  .get(
    '/pickup-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(pickupLogsController.list.bind(pickupLogsController)),
  )
  .patch(
    '/pickup-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(pickupLogsController.update.bind(pickupLogsController)),
  )
  .delete(
    '/pickup-logs/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(pickupLogsController.delete.bind(pickupLogsController)),
  );

export default router;
