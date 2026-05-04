import express from 'express';
import { TenantCableTypeController } from '../controllers/TenantCableTypeController.js';
import { TenantCableTypeService } from '../services/TenantCableTypeService.js';
import { TenantCableTypeRepository } from '../repositories/TenantCableTypeRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const cableTypeRepo = new TenantCableTypeRepository();
const cableTypeService = new TenantCableTypeService(cableTypeRepo);
const controller = new TenantCableTypeController(cableTypeService);

const auth = tenantAuth(tenantRepo);

router.use(auth);

router.get('/',        rbac('cable_type.view'),   controller.index);
router.get('/:uuid',   rbac('cable_type.view'),   controller.show);
router.post('/',       rbac('cable_type.create'),  controller.create);
router.put('/:uuid',   rbac('cable_type.update'),  controller.update);
router.post('/:uuid/block',   rbac('cable_type.update'), controller.block);
router.put('/:uuid/unblock',  rbac('cable_type.update'), controller.unblock);
router.delete('/:uuid', rbac('cable_type.delete'), controller.delete);

export default router;
