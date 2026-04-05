import { Router } from 'express';
import { TenantBusinessController } from '../controllers/TenantBusinessController.js';
import { TenantBusinessService } from '../services/TenantBusinessService.js';
import { TenantBusinessRepository } from '../repositories/TenantBusinessRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const tenantBusinessRepository = new TenantBusinessRepository();
const countryRepository = new CountryRepository();
const tenantBusinessService = new TenantBusinessService(tenantBusinessRepository, countryRepository);
const tenantBusinessController = new TenantBusinessController(tenantBusinessService);

router.get('/', rbac('tenant_business.view'), tenantBusinessController.index);
router.post('/', rbac('tenant_business.create'), tenantBusinessController.create);
router.get('/:uuid', rbac('tenant_business.view'), tenantBusinessController.show);
router.put('/:uuid', rbac('tenant_business.update'), tenantBusinessController.update);
router.delete('/:uuid', rbac('tenant_business.delete'), tenantBusinessController.delete);

router.post('/:uuid/block', rbac('tenant_business.update'), tenantBusinessController.block);
router.put('/:uuid/unblock', rbac('tenant_business.update'), tenantBusinessController.unblock);
router.post('/:uuid/suspend', rbac('tenant_business.update'), tenantBusinessController.suspend);

export default router;
