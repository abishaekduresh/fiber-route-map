import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserService } from '../services/UserService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const userRepository = new UserRepository();
const countryRepository = new CountryRepository();
const roleRepository = new RoleRepository();
const userService = new UserService(userRepository, countryRepository, roleRepository);
const userController = new UserController(userService);

router.get('/', rbac('user.view'), userController.index);
router.post('/', rbac('user.create'), userController.create);
router.get('/:uuid', rbac('user.view'), userController.show);
router.put('/:uuid', rbac('user.update'), userController.update);
router.delete('/:uuid', rbac('user.delete'), userController.delete);

router.post('/:uuid/block', rbac('user.update'), userController.block);
router.put('/:uuid/unblock', rbac('user.update'), userController.unblock);
router.post('/:uuid/reset-password', rbac('user.update'), userController.resetPassword);

export default router;
