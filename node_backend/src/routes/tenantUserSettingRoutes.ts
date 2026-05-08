import { Router } from 'express';
import { TenantUserSettingRepository } from '../repositories/TenantUserSettingRepository.js';
import { TenantUserSettingService } from '../services/TenantUserSettingService.js';
import { TenantUserSettingController } from '../controllers/TenantUserSettingController.js';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = Router();
const controller = new TenantUserSettingController(
  new TenantUserSettingService(new TenantUserSettingRepository())
);

router.use(tenantAuth);

router.get('/',           controller.index);
router.put('/',           controller.upsert);
router.delete('/:key',    controller.deleteKey);

export default router;
