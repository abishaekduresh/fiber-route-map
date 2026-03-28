import { Router } from 'express';
import { RoleController } from '../controllers/RoleController.js';
import { RoleService } from '../services/RoleService.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
import { PermissionRepository } from '../repositories/PermissionRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();
const roleRepo = new RoleRepository();
const permissionRepo = new PermissionRepository();
const roleService = new RoleService(roleRepo, permissionRepo);
const roleController = new RoleController(roleService);

router.get('/', rbac('role.view'), roleController.getAll);
router.get('/:uuid', rbac('role.view'), roleController.getByUuid);
router.post('/', rbac('role.create'), roleController.create);
router.put('/:uuid', rbac('role.update'), roleController.update);
router.delete('/:uuid', rbac('role.delete'), roleController.delete);
router.put('/:uuid/restore', rbac('role.update'), roleController.restore);

// Permission Management for Roles
router.post('/:uuid/permissions', rbac('role.update'), roleController.syncPermissions);

export default router;
