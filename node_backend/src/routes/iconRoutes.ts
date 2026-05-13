import { Router } from 'express';
import multer from 'multer';
import { IconController } from '../controllers/IconController.js';
import { IconService } from '../services/IconService.js';
import { IconRepository } from '../repositories/IconRepository.js';
import { rbac } from '../middleware/rbac.js';

const router = Router();

const iconRepository = new IconRepository();
const iconService    = new IconService(iconRepository);
const iconController = new IconController(iconService);

// Multer — memory storage so controller decides what to do with the buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/svg+xml', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only SVG, PNG, and WebP files are allowed') as any, false);
  },
});

router.get('/',        rbac('icon.view'),   iconController.index);
router.post('/',       rbac('icon.create'), upload.single('file'), iconController.create);
router.get('/:uuid',   rbac('icon.view'),   iconController.show);
router.put('/:uuid',   rbac('icon.update'), upload.single('file'), iconController.update);
router.delete('/:uuid',rbac('icon.delete'), iconController.delete);

export default router;
