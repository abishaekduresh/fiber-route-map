import { Router, Request, Response, NextFunction } from 'express';
import { TenantUserController } from '../controllers/TenantUserController.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
import db from '../config/database.js';

const router = Router();
const tenantRepo = new TenantRepository();
const roleRepo = new RoleRepository();
const controller = new TenantUserController(tenantRepo);

// Roles with showForTenants = true
router.get('/roles', tenantAuth(tenantRepo), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { roles } = await roleRepo.getAll({ showForTenants: true, status: 'active', limit: -1 });
    res.json({
      success: true, statusCode: 200,
      data: roles.map((r: any) => ({ id: r.uuid, name: r.name, slug: r.slug })),
    });
  } catch (err) { next(err); }
});

// Country list for the create/edit form
router.get('/countries', tenantAuth(tenantRepo), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db('countries').orderBy('name', 'asc').select('uuid', 'name', 'code', 'phoneCode');
    res.json({
      success: true, statusCode: 200,
      data: rows.map((c: any) => ({
        id: c.uuid,
        attributes: { name: c.name, code: c.code, phoneCode: c.phoneCode },
      })),
    });
  } catch (err) { next(err); }
});

// Parent tenant's own business (auto-assigned to sub-users)
router.get('/businesses', tenantAuth(tenantRepo), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = (req as any).user;
    const data = tenant.business
      ? [{ id: tenant.business.uuid, name: tenant.business.name }]
      : [];
    res.json({ success: true, statusCode: 200, data });
  } catch (err) { next(err); }
});

// CRUD
router.get('/', tenantAuth(tenantRepo), controller.index);
router.post('/', tenantAuth(tenantRepo), controller.create);
router.get('/:uuid', tenantAuth(tenantRepo), controller.show);
router.put('/:uuid', tenantAuth(tenantRepo), controller.update);
router.delete('/:uuid', tenantAuth(tenantRepo), controller.delete);
router.post('/:uuid/block', tenantAuth(tenantRepo), controller.block);
router.put('/:uuid/unblock', tenantAuth(tenantRepo), controller.unblock);

export default router;
