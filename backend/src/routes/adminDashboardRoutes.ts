import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminDashboardController';
import { authenticate, requireRole } from '../middleware/auth';

import {
  adminGetBonuses,
  adminUpdateBonus,
  adminUpdateBonusStatus,
  adminDeleteBonus,
} from '../controllers/adminDashboardController';

const router = Router();

router.get('/dashboard/stats', authenticate, requireRole('ADMIN'), getDashboardStats);

router.get('/bonuses', authenticate, requireRole('ADMIN'), adminGetBonuses);
router.put('/bonuses/:id', authenticate, requireRole('ADMIN'), adminUpdateBonus);
router.patch('/bonuses/:id/status', authenticate, requireRole('ADMIN'), adminUpdateBonusStatus);
router.delete('/bonuses/:id', authenticate, requireRole('ADMIN'), adminDeleteBonus);

export default router;
