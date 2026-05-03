import { Router } from 'express';
import { TenantUserController } from '../controllers/TenantUserController.js';
import { TenantUserRepository } from '../repositories/TenantUserRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = Router();
const tenantRepo = new TenantRepository();
const tenantUserRepo = new TenantUserRepository();
const controller = new TenantUserController(tenantUserRepo);

// All routes require a valid tenant JWT
router.get('/', tenantAuth(tenantRepo), controller.index);
router.post('/', tenantAuth(tenantRepo), controller.create);
router.get('/:uuid', tenantAuth(tenantRepo), controller.show);
router.put('/:uuid', tenantAuth(tenantRepo), controller.update);
router.delete('/:uuid', tenantAuth(tenantRepo), controller.delete);
router.post('/:uuid/block', tenantAuth(tenantRepo), controller.block);
router.put('/:uuid/unblock', tenantAuth(tenantRepo), controller.unblock);

export default router;
