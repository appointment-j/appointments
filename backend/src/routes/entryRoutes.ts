import { Router } from 'express';
import { createEntry, getEntries } from '../controllers/entryController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', createEntry);
router.get('/', authenticate, requireRole('ADMIN'), getEntries);

export default router;

