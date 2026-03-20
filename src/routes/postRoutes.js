import express from 'express'
import asyncWrapper from '../middlewares/asyncWrapper.js'
import PostController from '../controllers/PostController.js'
import AuthMiddleware from '../middlewares/AuthMiddleware.js'

const router = express.Router()

const postController = new PostController()

router.post("/post", AuthMiddleware, asyncWrapper(postController.createPost.bind(postController)))

export default router