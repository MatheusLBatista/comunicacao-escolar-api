import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import PickupAuthorizationController from '../controllers/PickupAuthorizationController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const pickupAuthorizationController = new PickupAuthorizationController();

router
  .post(
    '/pickup-authorizations',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.create.bind(pickupAuthorizationController),
    ),
  )
  .get(
    '/pickup-authorizations',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.list.bind(pickupAuthorizationController),
    ),
  )
  .get(
    '/pickup-authorizations/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.list.bind(pickupAuthorizationController),
    ),
  );

export default router;
