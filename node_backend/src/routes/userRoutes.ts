import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserService } from '../services/UserService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { CountryRepository } from '../repositories/CountryRepository.js';

const router = Router();

const userRepository = new UserRepository();
const countryRepository = new CountryRepository();
const userService = new UserService(userRepository, countryRepository);
const userController = new UserController(userService);

router.get('/', userController.index);
router.post('/', userController.create);
router.get('/:uuid', userController.show);
router.put('/:uuid', userController.update);
router.delete('/:uuid', userController.delete);

router.post('/:uuid/block', userController.block);
router.put('/:uuid/unblock', userController.unblock);
router.post('/:uuid/reset-password', userController.resetPassword);

export default router;
