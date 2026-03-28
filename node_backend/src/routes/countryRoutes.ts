import { Router } from 'express';
import { CountryController } from '../controllers/CountryController.js';
import { CountryService } from '../services/CountryService.js';
import { CountryRepository } from '../repositories/CountryRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const countryRepository = new CountryRepository();
const countryService = new CountryService(countryRepository);
const countryController = new CountryController(countryService);

router.get('/', rbac('country.view'), countryController.index);
router.post('/', rbac('country.create'), countryController.create);
router.get('/:uuid', rbac('country.view'), countryController.show);
router.put('/:uuid', rbac('country.update'), countryController.update);
router.delete('/:uuid', rbac('country.delete'), countryController.delete);

router.post('/:uuid/block', rbac('country.update'), countryController.block);
router.put('/:uuid/unblock', rbac('country.update'), countryController.unblock);

export default router;
