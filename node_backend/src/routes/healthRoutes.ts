import { Router } from 'express';
import { HealthController } from '../controllers/HealthController.js';

/**
 * Routes for health-related endpoints.
 */
const healthRoutes = Router();
const healthController = new HealthController();

// GET /api/health
healthRoutes.get('/', healthController.check);

export default healthRoutes;
