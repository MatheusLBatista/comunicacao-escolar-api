import express from 'express';
import asyncWrapper from '../middlewares/asyncWrapper.js';
import PostController from '../controllers/PostController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const postController = new PostController();

router.post(
  '/schools/:schoolId/post',
  AuthMiddleware,
  asyncWrapper(postController.create.bind(postController)),
);

router.get(
  '/schools/:schoolId/post',
  AuthMiddleware,
  asyncWrapper(postController.list.bind(postController)),
);

router.get(
  '/posts/:id',
  AuthMiddleware,
  asyncWrapper(postController.list.bind(postController)),
);

router.patch(
  '/posts/:id',
  AuthMiddleware,
  asyncWrapper(postController.update.bind(postController)),
);

export default router;
