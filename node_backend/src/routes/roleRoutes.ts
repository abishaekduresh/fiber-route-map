import { Router } from 'express';
import { RoleController } from '../controllers/RoleController.js';
import { RoleService } from '../services/RoleService.js';
import { RoleRepository } from '../repositories/RoleRepository.js';

const router = Router();
const roleRepo = new RoleRepository();
const roleService = new RoleService(roleRepo);
const roleController = new RoleController(roleService);

router.get('/', roleController.getAll);
router.get('/:uuid', roleController.getByUuid);
router.post('/', roleController.create);
router.put('/:uuid', roleController.update);
router.delete('/:uuid', roleController.delete);
router.put('/:uuid/restore', roleController.restore);

export default router;
