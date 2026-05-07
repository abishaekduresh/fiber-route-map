import express from 'express';
import { TenantDeviceCategoryController } from '../controllers/TenantDeviceCategoryController.js';
import { TenantDeviceCategoryService } from '../services/TenantDeviceCategoryService.js';
import { TenantDeviceCategoryRepository } from '../repositories/TenantDeviceCategoryRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const deviceCategoryRepo = new TenantDeviceCategoryRepository();
const deviceCategoryService = new TenantDeviceCategoryService(deviceCategoryRepo);
const controller = new TenantDeviceCategoryController(deviceCategoryService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/',                    rbac('device_category.view'),   controller.index);
router.get('/:uuid',               rbac('device_category.view'),   controller.show);
router.post('/',                   rbac('device_category.create'),  controller.create);
router.put('/:uuid',               rbac('device_category.update'),  controller.update);
router.post('/:uuid/deactivate',   rbac('device_category.update'),  controller.deactivate);
router.put('/:uuid/activate',      rbac('device_category.update'),  controller.activate);
router.delete('/:uuid',            rbac('device_category.delete'),  controller.delete);

export default router;
