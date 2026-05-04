import express from 'express';
import { TenantUpstreamProviderController } from '../controllers/TenantUpstreamProviderController.js';
import { TenantUpstreamProviderService } from '../services/TenantUpstreamProviderService.js';
import { TenantUpstreamProviderRepository } from '../repositories/TenantUpstreamProviderRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const providerRepo = new TenantUpstreamProviderRepository();
const providerService = new TenantUpstreamProviderService(providerRepo);
const controller = new TenantUpstreamProviderController(providerService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/',        rbac('upstream_provider.view'),   controller.index);
router.get('/:uuid',   rbac('upstream_provider.view'),   controller.show);
router.post('/',       rbac('upstream_provider.create'),  controller.create);
router.put('/:uuid',   rbac('upstream_provider.update'),  controller.update);
router.post('/:uuid/block',   rbac('upstream_provider.update'), controller.block);
router.put('/:uuid/unblock',  rbac('upstream_provider.update'), controller.unblock);
router.delete('/:uuid', rbac('upstream_provider.delete'), controller.delete);

export default router;
