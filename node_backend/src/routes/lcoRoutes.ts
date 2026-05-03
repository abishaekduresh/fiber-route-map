import express from 'express';
import { LcoController } from '../controllers/LcoController.js';
import { LcoService } from '../services/LcoService.js';
import { LcoRepository } from '../repositories/LcoRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const lcoRepo = new LcoRepository();
const lcoService = new LcoService(lcoRepo, tenantRepo);
const lcoController = new LcoController(lcoService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/', lcoController.index);
router.get('/:uuid', lcoController.show);
router.post('/', lcoController.create);
router.put('/:uuid', lcoController.update);
router.delete('/:uuid', lcoController.delete);

export default router;
