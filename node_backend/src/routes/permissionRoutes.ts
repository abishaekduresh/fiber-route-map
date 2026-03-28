import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController.js';
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
const permissionController = new PermissionController(permissionRepo);

// Apply auth middleware to all permission routes
router.use(auth(authService));

router.get('/', rbac('role.view'), permissionController.getAll);
router.get('/:uuid', rbac('role.view'), permissionController.getByUuid);
router.post('/', rbac('role.create'), permissionController.create);
router.put('/:uuid', rbac('role.update'), permissionController.update);
router.delete('/:uuid', rbac('role.delete'), permissionController.delete);

export default router;
