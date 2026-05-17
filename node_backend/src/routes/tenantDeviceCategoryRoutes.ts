import express from 'express';
import db from '../config/database.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const auth = tenantAuth(tenantRepo);
router.use(auth);

// GET /api/tenant/device-categories — active global device categories for tenant use
router.get('/', async (_req, res, next) => {
  try {
    const rows = await db('device_categories')
      .where('status', 'active')
      .orderBy('name', 'asc')
      .select('id', 'uuid', 'code', 'name', 'description', 'status');

    return res.json({
      success: true,
      statusCode: 200,
      message: rows.length ? 'Device categories retrieved successfully' : 'No active device categories found',
      data: rows.map((c: any) => ({
        id: c.uuid,
        type: 'device_category',
        attributes: {
          numericId:   c.id,
          code:        c.code,
          name:        c.name,
          description: c.description ?? null,
          status:      c.status,
        },
      })),
    });
  } catch (err) { next(err); }
});

export default router;
