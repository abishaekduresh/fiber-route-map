import express from 'express';
import { AdminSupportTicketController } from '../controllers/AdminSupportTicketController.js';
import { TenantSupportTicketService } from '../services/TenantSupportTicketService.js';
import { TenantSupportTicketRepository } from '../repositories/TenantSupportTicketRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const ticketRepo = new TenantSupportTicketRepository();
const ticketService = new TenantSupportTicketService(ticketRepo);
const controller = new AdminSupportTicketController(ticketService);

// Auth is applied in index.ts via auth(authService)
router.get('/',              rbac('support_ticket.view'),   controller.index);
router.get('/:uuid',         rbac('support_ticket.view'),   controller.show);
router.put('/:uuid',         rbac('support_ticket.update'),  controller.update);
router.get('/:uuid/messages',  rbac('support_ticket.view'),   controller.getMessages);
router.post('/:uuid/messages', rbac('support_ticket.update'), controller.addMessage);
router.get('/:uuid/logs',    rbac('support_ticket.view'),   controller.getLogs);

export default router;
