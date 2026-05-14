import { Router } from 'express';
import { rbac } from '../middleware/rbac.js';
import { DeviceTypeRepository }  from '../repositories/DeviceTypeRepository.js';
import { DeviceTypeService }      from '../services/DeviceTypeService.js';
import { DeviceTypeController }   from '../controllers/DeviceTypeController.js';

const router     = Router();
const repo       = new DeviceTypeRepository();
const service    = new DeviceTypeService(repo);
const controller = new DeviceTypeController(service);

router.get('/',        rbac('device_types.view'),   controller.index);
router.post('/',       rbac('device_types.create'), controller.create);
router.get('/:uuid',   rbac('device_types.view'),   controller.show);
router.put('/:uuid',   rbac('device_types.update'), controller.update);
router.delete('/:uuid',rbac('device_types.delete'), controller.delete);

export default router;
