import express from 'express';
import asyncWrapper from '../middlewares/asyncWrapper.js';
import PostController from '../controllers/PostController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';

const router = express.Router();

const postController = new PostController();

router.post(
  '/post',
  AuthMiddleware,
  asyncWrapper(postController.create.bind(postController)),
);

router.get('/post', 
  AuthMiddleware,
  asyncWrapper(postController.list.bind(postController))
);

router.get('/post/:id',
  AuthMiddleware,
  asyncWrapper(postController.list.bind(postController)),
)

export default router;
