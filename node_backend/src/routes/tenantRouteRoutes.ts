import express from 'express';
import { TenantRouteController } from '../controllers/TenantRouteController.js';
import { TenantRouteService } from '../services/TenantRouteService.js';
import { TenantRouteRepository } from '../repositories/TenantRouteRepository.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const routeRepo  = new TenantRouteRepository();
const routeSvc   = new TenantRouteService(routeRepo);
const controller = new TenantRouteController(routeSvc);

const auth = tenantAuth(tenantRepo);
router.use(auth);

router.get('/',             rbac('tenant_routes.view'),   controller.index);
router.get('/:uuid',        rbac('tenant_routes.view'),   controller.show);
router.get('/:uuid/history',rbac('tenant_routes.view'),   controller.history);
router.post('/',            rbac('tenant_routes.create'),  controller.create);
router.put('/:uuid',        rbac('tenant_routes.update'),  controller.update);
router.delete('/:uuid',     rbac('tenant_routes.delete'),  controller.delete);

export default router;
