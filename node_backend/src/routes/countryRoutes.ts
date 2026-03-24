import { Router } from 'express';
import { CountryController } from '../controllers/CountryController.js';
import { CountryService } from '../services/CountryService.js';
import { CountryRepository } from '../repositories/CountryRepository.js';

const router = Router();

const countryRepository = new CountryRepository();
const countryService = new CountryService(countryRepository);
const countryController = new CountryController(countryService);

router.get('/', countryController.index);
router.post('/', countryController.create);
router.get('/:uuid', countryController.show);
router.put('/:uuid', countryController.update);
router.delete('/:uuid', countryController.delete);

router.post('/:uuid/block', countryController.block);
router.put('/:uuid/unblock', countryController.unblock);

export default router;
