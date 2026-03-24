import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserService } from '../services/UserService.js';
import { UserRepository } from '../repositories/UserRepository.js';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/', userController.index);
router.post('/', userController.create);
router.get('/:uuid', userController.show);
router.put('/:uuid', userController.update);
router.delete('/:uuid', userController.delete);

router.post('/:uuid/block', userController.block);
router.put('/:uuid/unblock', userController.unblock);

export default router;
