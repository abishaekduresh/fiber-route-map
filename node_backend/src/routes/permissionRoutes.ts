import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController.js';
import { PermissionService } from '../services/PermissionService.js';
import { PermissionRepository } from '../repositories/PermissionRepository.js';
import { auth } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';
import { AuthService } from '../services/AuthService.js';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';

const router = Router();
const userRepo = new UserRepository();
const authRepo = new AuthRepository();
const authService = new AuthService(authRepo, userRepo);
const permissionRepo = new PermissionRepository();
const permissionService = new PermissionService(permissionRepo);
const permissionController = new PermissionController(permissionService);

// Apply auth middleware to all permission routes
router.use(auth(authService));

router.get('/', rbac('permission.view'), permissionController.getAll);
router.get('/:uuid', rbac('permission.view'), permissionController.getByUuid);
router.post('/sync', rbac('permission.create'), permissionController.sync);
router.post('/', rbac('permission.create'), permissionController.create);
router.put('/:uuid', rbac('permission.update'), permissionController.update);
router.delete('/:uuid', rbac('permission.delete'), permissionController.delete);

export default router;
