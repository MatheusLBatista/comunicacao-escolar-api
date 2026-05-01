import express from 'express'
import asyncWrapper from '../middlewares/asyncWrapper.js'
import ClassController from '../controllers/ClassController.js'
import AuthMiddleware from '../middlewares/AuthMiddleware.js'
import AuthPermission from '../middlewares/AuthPermission.js'

const router = express.Router()

const classController = new ClassController()

router.get('/schools/:schoolId/class', AuthMiddleware, AuthPermission, asyncWrapper(classController.list.bind(classController)))
router.post('/schools/:schoolId/class', AuthMiddleware, AuthPermission, asyncWrapper(classController.create.bind(classController)))
router.get('/schools/:schoolId/class/:id', AuthMiddleware, AuthPermission, asyncWrapper(classController.list.bind(classController)))
router.patch('/schools/:schoolId/class/:id', AuthMiddleware, AuthPermission, asyncWrapper(classController.update.bind(classController)))
router.delete('/schools/:schoolId/class/:id', AuthMiddleware, AuthPermission, asyncWrapper(classController.delete.bind(classController)))
export default router