import { Router } from 'express';
import { rbac } from '../middleware/rbac.js';
import { DeviceCategoryRepository }  from '../repositories/DeviceCategoryRepository.js';
import { DeviceCategoryService }      from '../services/DeviceCategoryService.js';
import { DeviceCategoryController }   from '../controllers/DeviceCategoryController.js';

const router     = Router();
const repo       = new DeviceCategoryRepository();
const service    = new DeviceCategoryService(repo);
const controller = new DeviceCategoryController(service);

router.get('/',        rbac('device_categories.view'),   controller.index);
router.post('/',       rbac('device_categories.create'), controller.create);
router.get('/:uuid',   rbac('device_categories.view'),   controller.show);
router.put('/:uuid',   rbac('device_categories.update'), controller.update);
router.delete('/:uuid',rbac('device_categories.delete'), controller.delete);

export default router;
