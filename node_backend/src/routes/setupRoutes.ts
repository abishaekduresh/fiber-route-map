import { Router } from 'express';
import { SetupController } from '../controllers/SetupController.js';

const router = Router();
const controller = new SetupController();

/**
 * Setup routes — no auth, no versionCheck, no dbCheck middleware.
 * These are intentionally open so the wizard can run before the DB exists.
 */
router.get('/status', controller.status);
router.post('/test-connection', controller.testConnection);
router.post('/run', controller.run);

export default router;
