import { Router } from 'express';
import { WidgetController } from '../controllers/WidgetController.js';
import { WidgetService } from '../services/WidgetService.js';
import { WidgetRepository } from '../repositories/WidgetRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const widgetRepository = new WidgetRepository();
const widgetService    = new WidgetService(widgetRepository);
const widgetController = new WidgetController(widgetService);

router.get('/',        rbac('widget.view'),   widgetController.index);
router.post('/',       rbac('widget.create'), widgetController.create);
router.get('/:uuid',   rbac('widget.view'),   widgetController.show);
router.put('/:uuid',   rbac('widget.update'), widgetController.update);
router.delete('/:uuid',rbac('widget.delete'), widgetController.delete);

export default router;
