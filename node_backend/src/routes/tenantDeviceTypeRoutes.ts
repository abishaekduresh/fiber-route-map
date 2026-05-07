import express from 'express';
import { TenantDeviceTypeController } from '../controllers/TenantDeviceTypeController.js';
import { TenantDeviceTypeService } from '../services/TenantDeviceTypeService.js';
import { TenantDeviceTypeRepository } from '../repositories/TenantDeviceTypeRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const deviceTypeRepo = new TenantDeviceTypeRepository();
const deviceTypeService = new TenantDeviceTypeService(deviceTypeRepo);
const controller = new TenantDeviceTypeController(deviceTypeService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/',        rbac('device_type.view'),    controller.index);
router.get('/:uuid',   rbac('device_type.view'),    controller.show);
router.post('/',       rbac('device_type.create'),   controller.create);
router.put('/:uuid',   rbac('device_type.update'),   controller.update);
router.delete('/:uuid', rbac('device_type.delete'),  controller.delete);

export default router;
