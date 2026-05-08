import { Router } from 'express';
import { TenantUserSettingRepository } from '../repositories/TenantUserSettingRepository.js';
import { TenantUserSettingService } from '../services/TenantUserSettingService.js';
import { TenantUserSettingController } from '../controllers/TenantUserSettingController.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = Router();
const tenantRepo = new TenantRepository();
const auth = tenantAuth(tenantRepo);
const controller = new TenantUserSettingController(
  new TenantUserSettingService(new TenantUserSettingRepository())
);

router.use(auth);

router.get('/',           controller.index);
router.put('/',           controller.upsert);
router.delete('/:key',    controller.deleteKey);

export default router;
