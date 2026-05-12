import express from 'express';
import db from '../config/database.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const auth = tenantAuth(tenantRepo);
router.use(auth);

// GET /api/tenant/widgets — active widgets list for tenant use (e.g. map point association)
router.get('/', async (req, res, next) => {
  try {
    const widgets = await db('widgets')
      .where('status', 'active')
      .orderBy('name', 'asc')
      .select('uuid', 'code', 'name', 'type', 'iconType', 'svgTemplate', 'iconUrl', 'width', 'height');

    return res.json({
      success: true,
      statusCode: 200,
      message: widgets.length ? 'Widgets retrieved successfully' : 'No active widgets found',
      data: widgets.map((w: any) => ({
        id: w.uuid,
        type: 'widget',
        attributes: {
          code:        w.code,
          name:        w.name,
          type:        w.type,
          iconType:    w.iconType,
          svgTemplate: w.svgTemplate,
          iconUrl:     w.iconUrl,
          width:       w.width,
          height:      w.height,
        },
      })),
    });
  } catch (err) { next(err); }
});

export default router;
