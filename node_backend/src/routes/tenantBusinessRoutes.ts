import { Router } from 'express';
import { TenantBusinessController } from '../controllers/TenantBusinessController.js';
import { TenantBusinessService } from '../services/TenantBusinessService.js';
import { TenantBusinessRepository } from '../repositories/TenantBusinessRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const tenantBusinessRepository = new TenantBusinessRepository();
const countryRepository = new CountryRepository();
const tenantRepository = new TenantRepository();
const tenantBusinessService = new TenantBusinessService(tenantBusinessRepository, countryRepository, tenantRepository);
const tenantBusinessController = new TenantBusinessController(tenantBusinessService);

router.get('/', rbac('tenant_business.view'), tenantBusinessController.index);
router.post('/', rbac('tenant_business.create'), tenantBusinessController.create);
router.get('/:uuid', rbac('tenant_business.view'), tenantBusinessController.show);
router.put('/:uuid', rbac('tenant_business.update'), tenantBusinessController.update);
router.delete('/:uuid', rbac('tenant_business.delete'), tenantBusinessController.delete);

router.post('/:uuid/block', rbac('tenant_business.update'), tenantBusinessController.block);
router.put('/:uuid/unblock', rbac('tenant_business.update'), tenantBusinessController.unblock);
router.post('/:uuid/suspend', rbac('tenant_business.update'), tenantBusinessController.suspend);
router.put('/:uuid/reactivate', rbac('tenant_business.update'), tenantBusinessController.reactivate);

export default router;
