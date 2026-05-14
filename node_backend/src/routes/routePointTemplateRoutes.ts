import { Router } from 'express';
import { rbac } from '../middleware/rbac.js';
import { RoutePointTemplateRepository } from '../repositories/RoutePointTemplateRepository.js';
import { RoutePointTemplateService }    from '../services/RoutePointTemplateService.js';
import { RoutePointTemplateController } from '../controllers/RoutePointTemplateController.js';

const router = Router();
const repo       = new RoutePointTemplateRepository();
const service    = new RoutePointTemplateService(repo);
const controller = new RoutePointTemplateController(service);

router.get('/',        rbac('route_point_templates.view'),   controller.index);
router.post('/',       rbac('route_point_templates.create'), controller.create);
router.get('/:uuid',   rbac('route_point_templates.view'),   controller.show);
router.put('/:uuid',   rbac('route_point_templates.update'), controller.update);
router.delete('/:uuid',rbac('route_point_templates.delete'), controller.delete);

export default router;
