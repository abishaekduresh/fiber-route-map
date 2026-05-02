import { Router } from 'express';
import { AuditLogController } from '../controllers/AuditLogController.js';
import { AuditLogService } from '../services/AuditLogService.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const auditLogRepository = new AuditLogRepository();
const auditLogService = new AuditLogService(auditLogRepository);
const auditLogController = new AuditLogController(auditLogService);

router.get('/', rbac('audit_log.view'), auditLogController.index);
router.get('/:uuid', rbac('audit_log.view'), auditLogController.show);

export { auditLogService };
export default router;
