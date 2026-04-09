import express from 'express';
import LikeController from '../controllers/LikeController.js';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import asyncWrapper from '../middlewares/asyncWrapper.js';

const router = express.Router();

const likeController = new LikeController();

router.post('/posts/:id/like', AuthMiddleware, AuthPermission, asyncWrapper(likeController.toggleLike.bind(likeController)));

export default router;