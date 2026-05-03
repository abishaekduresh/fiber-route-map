import express from 'express';
import { LcoController } from '../controllers/LcoController.js';
import { LcoService } from '../services/LcoService.js';
import { LcoRepository } from '../repositories/LcoRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const lcoRepo = new LcoRepository();
const lcoService = new LcoService(lcoRepo, tenantRepo);
const lcoController = new LcoController(lcoService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/', rbac('lco.view'), lcoController.index);
router.get('/:uuid', rbac('lco.view'), lcoController.show);
router.post('/', rbac('lco.create'), lcoController.create);
router.put('/:uuid', rbac('lco.update'), lcoController.update);
router.delete('/:uuid', rbac('lco.delete'), lcoController.delete);

export default router;
