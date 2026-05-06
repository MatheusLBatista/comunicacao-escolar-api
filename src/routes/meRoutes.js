import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import MeController from '../controllers/MeController.js';
import { asyncWrapper } from '../utils/helpers/index.js';
import upload from '../config/MulterConfig.js';

const router = express.Router();

const meController = new MeController();

router
  .get('/me', AuthMiddleware, asyncWrapper(meController.getMe.bind(meController)))
  .patch('/me', AuthMiddleware, asyncWrapper(meController.updateMe.bind(meController)))
  .patch(
    '/me/password',
    AuthMiddleware,
    asyncWrapper(meController.changePassword.bind(meController)),
  )
  .patch(
    '/me/avatar',
    AuthMiddleware,
    upload.single('avatar'),
    asyncWrapper(meController.uploadAvatar.bind(meController)),
  )
  .delete(
    '/me/avatar',
    AuthMiddleware,
    asyncWrapper(meController.deleteAvatar.bind(meController)),
  );

export default router;
