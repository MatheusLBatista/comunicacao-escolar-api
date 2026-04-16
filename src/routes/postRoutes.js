import express from 'express';
import asyncWrapper from '../middlewares/asyncWrapper.js';
import PostController from '../controllers/PostController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import upload from '../config/MulterConfig.js';

const router = express.Router();

const postController = new PostController();

router.post(
  '/schools/:schoolId/posts',
  AuthMiddleware,
  asyncWrapper(postController.create.bind(postController)),
);

router.get(
  '/schools/:schoolId/posts',
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

router.delete('/posts/:id',
  AuthMiddleware,
  asyncWrapper(postController.delete.bind(postController))
)

router.post('/posts/:id/attachments',
  AuthMiddleware,
  upload.array('files', 10),
  asyncWrapper(postController.uploadFoto.bind(postController))
)

router.delete('/posts/:postId/attachments/:linkId',
  AuthMiddleware,
  asyncWrapper(postController.deleteFoto.bind(postController))
)

router.get('/attachments/:id', 
  AuthMiddleware,
  asyncWrapper(postController.getFoto.bind(postController))
)
export default router;
