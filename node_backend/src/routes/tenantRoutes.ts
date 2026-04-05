import { Router } from 'express';
import { TenantController } from '../controllers/TenantController.js';
import { TenantService } from '../services/TenantService.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const tenantRepository = new TenantRepository();
const countryRepository = new CountryRepository();
const tenantService = new TenantService(tenantRepository, countryRepository);
const tenantController = new TenantController(tenantService);

router.get('/', rbac('tenant.view'), tenantController.index);
router.post('/', rbac('tenant.create'), tenantController.create);
router.get('/:uuid', rbac('tenant.view'), tenantController.show);
router.put('/:uuid', rbac('tenant.update'), tenantController.update);
router.delete('/:uuid', rbac('tenant.delete'), tenantController.delete);

router.post('/:uuid/block', rbac('tenant.update'), tenantController.block);
router.put('/:uuid/unblock', rbac('tenant.update'), tenantController.unblock);
router.post('/:uuid/suspend', rbac('tenant.update'), tenantController.suspend);

export default router;
