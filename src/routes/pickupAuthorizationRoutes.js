import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import PickupAuthorizationController from '../controllers/PickupAuthorizationController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import upload from '../config/MulterConfig.js';

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
  )
  .patch(
    '/pickup-authorizations/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.update.bind(pickupAuthorizationController),
    ),
  )
  .delete(
    '/pickup-authorizations/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.delete.bind(pickupAuthorizationController),
    ),
  );

router
  .post(
    '/pickup-authorizations/:id/photo',
    AuthMiddleware,
    AuthPermission,
    upload.single('photo'),
    asyncWrapper(
      pickupAuthorizationController.uploadPhoto.bind(pickupAuthorizationController),
    ),
  )
  .delete(
    '/pickup-authorizations/:id/photo',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(
      pickupAuthorizationController.deletePhoto.bind(pickupAuthorizationController),
    ),
  );

export default router;
