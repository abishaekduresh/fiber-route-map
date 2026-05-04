import express from 'express';
import { TenantSupportTicketController } from '../controllers/TenantSupportTicketController.js';
import { TenantSupportTicketService } from '../services/TenantSupportTicketService.js';
import { TenantSupportTicketRepository } from '../repositories/TenantSupportTicketRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const ticketRepo = new TenantSupportTicketRepository();
const ticketService = new TenantSupportTicketService(ticketRepo);
const controller = new TenantSupportTicketController(ticketService);

const auth = tenantAuth(tenantRepo);
router.use(auth);

router.get('/',              rbac('support_ticket.view'),   controller.index);
router.get('/:uuid',         rbac('support_ticket.view'),   controller.show);
router.post('/',             rbac('support_ticket.create'),  controller.create);
router.put('/:uuid',         rbac('support_ticket.update'),  controller.update);
router.post('/:uuid/close',  rbac('support_ticket.update'),  controller.close);
router.get('/:uuid/messages',  rbac('support_ticket.view'),   controller.getMessages);
router.post('/:uuid/messages', rbac('support_ticket.create'), controller.addMessage);
router.get('/:uuid/logs',    rbac('support_ticket.view'),   controller.getLogs);

export default router;
