import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import EventController from '../controllers/EventController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const eventController = new EventController();

router
  .get(
    '/events',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(eventController.list.bind(eventController)),
  )
  .get(
    '/events/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(eventController.list.bind(eventController)),
  );

export default router;
