import express from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware.js';
import AuthPermission from '../middlewares/AuthPermission.js';
import AuditLogController from '../controllers/AuditLogController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const auditLogController = new AuditLogController();

router
  .get(
    '/schools/:id/audit-logs',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.list.bind(auditLogController)),
  )
  .get(
    '/schools/:id/audit-logs/summary',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.summary.bind(auditLogController)),
  )
  .get(
    '/schools/:id/audit-logs/resource/:resourceType/:resourceId',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.listByResource.bind(auditLogController)),
  )
  .get(
    '/schools/:id/audit-logs/user/:userId',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.listByUser.bind(auditLogController)),
  )
  .get(
    '/schools/:id/audit-logs/student/:studentId',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.listByStudent.bind(auditLogController)),
  )
  .get(
    '/schools/:id/audit-logs/:logId',
    AuthMiddleware,
    AuthPermission,
    asyncWrapper(auditLogController.getById.bind(auditLogController)),
  );

export default router;
