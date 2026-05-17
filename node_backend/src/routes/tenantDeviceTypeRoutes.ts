import express from 'express';
import db from '../config/database.js';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { TenantRepository } from '../repositories/TenantRepository.js';

const router = express.Router();
const tenantRepo = new TenantRepository();
const auth = tenantAuth(tenantRepo);
router.use(auth);

// GET /api/tenant/device-types — active global device types for tenant use
router.get('/', async (_req, res, next) => {
  try {
    const rows = await db('device_types')
      .leftJoin('device_categories', 'device_types.categoryId', 'device_categories.id')
      .leftJoin('icons', 'device_types.iconId', 'icons.id')
      .where('device_types.status', 'active')
      .orderBy('device_types.name', 'asc')
      .select(
        'device_types.id',
        'device_types.uuid',
        'device_types.code',
        'device_types.name',
        'device_types.description',
        'device_types.status',
        'device_categories.name as categoryName',
        'icons.svgTemplate as iconSvgTemplate',
        'icons.iconUrl',
        'icons.iconType as iconFileType',
        'icons.name as iconName',
        'icons.code as iconCode',
      );

    return res.json({
      success: true,
      statusCode: 200,
      message: rows.length ? 'Device types retrieved successfully' : 'No active device types found',
      data: rows.map((t: any) => ({
        id: t.uuid,
        type: 'device_type',
        attributes: {
          numericId:       t.id,
          code:            t.code,
          name:            t.name,
          description:     t.description ?? null,
          status:          t.status,
          categoryName:    t.categoryName    ?? null,
          iconSvgTemplate: t.iconSvgTemplate ?? null,
          iconUrl:         t.iconUrl         ?? null,
          iconFileType:    t.iconFileType     ?? null,
          iconName:        t.iconName        ?? null,
          iconCode:        t.iconCode        ?? null,
        },
      })),
    });
  } catch (err) { next(err); }
});

export default router;
