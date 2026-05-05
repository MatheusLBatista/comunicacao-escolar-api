import express from 'express';
import AuthController from '../controllers/AuthController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const authController = new AuthController();

router
  .post('/register', asyncWrapper(authController.register.bind(authController)))
  .post('/google', asyncWrapper(authController.googleAuth.bind(authController)))
  .post('/login', asyncWrapper(authController.login.bind(authController)))
  .post(
    '/recover',
    asyncWrapper(authController.recoverPassword.bind(authController)),
  )
  .patch(
    '/password/reset',
    asyncWrapper(authController.updatePasswordByToken.bind(authController)),
  )
  .post('/logout', asyncWrapper(authController.logout.bind(authController)))
  .post('/revoke', asyncWrapper(authController.revoke.bind(authController)))
  .post('/refresh', asyncWrapper(authController.refresh.bind(authController)))
  .post('/introspect', asyncWrapper(authController.pass.bind(authController)))
  .post(
    '/fcm-token',
    AuthMiddleware,
    asyncWrapper(authController.registerFcmToken.bind(authController)),
  );

export default router;
