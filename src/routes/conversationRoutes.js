import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import ConversationController from '../controllers/ConversationController.js';
import MessageController from '../controllers/MessageController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const conversationController = new ConversationController();
const messageController = new MessageController();

router
  .get(
    '/schools/:schoolId/conversations',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(conversationController.list.bind(conversationController)),
  )
  .post(
    '/schools/:schoolId/conversations',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(conversationController.findOrCreate.bind(conversationController)),
  )
  .get(
    '/conversations/:id',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(conversationController.getById.bind(conversationController)),
  )
  .get(
    '/conversations/:conversationId/messages',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(messageController.list.bind(messageController)),
  )
  .post(
    '/conversations/:conversationId/messages',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(messageController.send.bind(messageController)),
  )
  .patch(
    '/conversations/:conversationId/messages/read',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(messageController.markAsRead.bind(messageController)),
  );

export default router;
