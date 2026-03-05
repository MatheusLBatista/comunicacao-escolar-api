import express from 'express';
import LikeController from '../controllers/LikeController';
import AuthMiddleware from '../middlewares/AuthMiddleware';
import AuthPermission from '../middlewares/AuthPermission';
import asyncWrapper from '../middlewares/asyncWrapper';

const router = express.Router();

const likeController = new LikeController();

router.post('/like', AuthMiddleware, AuthPermission, asyncWrapper(likeController.toggleLike.bind(likeController)));

export default router;